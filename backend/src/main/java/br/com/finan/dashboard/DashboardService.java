package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.IntStream;

import br.com.finan.fixedentry.FixedEntryService;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

    private final FinancialTransactionRepository repository;
    private final FixedEntryService fixedEntryService;

    public DashboardService(FinancialTransactionRepository repository, FixedEntryService fixedEntryService) {
        this.repository = repository;
        this.fixedEntryService = fixedEntryService;
    }

    @Transactional
    public MonthlySummaryResponse monthly(int year, int month) {
        if (year < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year or month");
        }

        YearMonth yearMonth;
        try {
            yearMonth = YearMonth.of(year, month);
        } catch (DateTimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year or month", exception);
        }

        fixedEntryService.materialize(yearMonth);
        List<FinancialTransaction> transactions = repository.findAllByOccurredOnBetween(
                yearMonth.atDay(1), yearMonth.atEndOfMonth()).stream()
                .filter(transaction -> transaction.getFixedEntry() == null
                        || transaction.getFixedEntry().isActive())
                .toList();
        BigDecimal income = total(transactions, TransactionType.INCOME);
        BigDecimal expense = total(transactions, TransactionType.EXPENSE);
        BigDecimal investment = total(transactions, TransactionType.INVESTMENT);

        return new MonthlySummaryResponse(year, month, income, expense, investment,
                income.subtract(expense).subtract(investment), transactions.size());
    }

    @Transactional
    public DashboardComparisonResponse comparison(int year, int month) {
        if (year < 1 || year > 9999 || month < 1 || month > 12 || (year == 1 && month == 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year or month");
        }
        YearMonth currentPeriod = YearMonth.of(year, month);
        YearMonth previousPeriod = currentPeriod.minusMonths(1);

        MonthlySummaryResponse previous = monthly(previousPeriod.getYear(), previousPeriod.getMonthValue());
        MonthlySummaryResponse current = monthly(currentPeriod.getYear(), currentPeriod.getMonthValue());

        return new DashboardComparisonResponse(currentPeriod.toString(), previousPeriod.toString(),
                new ComparisonMetrics(
                        compare(current.totalIncome(), previous.totalIncome()),
                        compare(current.totalExpense(), previous.totalExpense()),
                        compare(current.availableBalance(), previous.availableBalance()),
                        compare(current.totalInvestment(), previous.totalInvestment())));
    }

    @Transactional
    public DashboardEvolutionResponse evolution(int year, int month) {
        if (year < 1 || year > 9999 || month < 1 || month > 12 || (year == 1 && month < 6)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year or month");
        }
        YearMonth endPeriod = YearMonth.of(year, month);
        YearMonth startPeriod = endPeriod.minusMonths(5);
        List<DashboardEvolutionPoint> points = IntStream.range(0, 6)
                .mapToObj(startPeriod::plusMonths)
                .map(period -> {
                    MonthlySummaryResponse summary = monthly(period.getYear(), period.getMonthValue());
                    return new DashboardEvolutionPoint(period.toString(), summary.totalIncome(),
                            summary.totalExpense(), summary.totalInvestment());
                })
                .toList();
        return new DashboardEvolutionResponse(startPeriod.toString(), endPeriod.toString(), points);
    }

    private MetricComparison compare(BigDecimal current, BigDecimal previous) {
        BigDecimal absoluteChange = current.subtract(previous);
        BigDecimal percentageChange = previous.signum() == 0
                ? (current.signum() == 0 ? BigDecimal.ZERO : null)
                : absoluteChange.multiply(BigDecimal.valueOf(100))
                        .divide(previous, 2, RoundingMode.HALF_UP);
        return new MetricComparison(current, previous, absoluteChange, percentageChange);
    }

    private BigDecimal total(List<FinancialTransaction> transactions, TransactionType type) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
