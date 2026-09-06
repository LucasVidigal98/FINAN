package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.YearMonth;
import java.util.List;

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

    public DashboardService(FinancialTransactionRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
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

        List<FinancialTransaction> transactions = repository.findAllByOccurredOnBetween(
                yearMonth.atDay(1), yearMonth.atEndOfMonth());
        BigDecimal income = total(transactions, TransactionType.INCOME);
        BigDecimal expense = total(transactions, TransactionType.EXPENSE);
        BigDecimal investment = total(transactions, TransactionType.INVESTMENT);

        return new MonthlySummaryResponse(year, month, income, expense, investment,
                income.subtract(expense).subtract(investment), transactions.size());
    }

    private BigDecimal total(List<FinancialTransaction> transactions, TransactionType type) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
