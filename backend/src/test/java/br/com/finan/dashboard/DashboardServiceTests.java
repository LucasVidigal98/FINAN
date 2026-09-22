package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import br.com.finan.fixedentry.FixedEntryService;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DashboardServiceTests {

    private FinancialTransactionRepository repository;
    private FixedEntryService fixedEntryService;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        repository = mock(FinancialTransactionRepository.class);
        fixedEntryService = mock(FixedEntryService.class);
        service = new DashboardService(repository, fixedEntryService);
    }

    @Test
    void comparesAllMetricsAndCrossesTheYearBoundary() {
        YearMonth previous = YearMonth.of(2025, 12);
        YearMonth current = YearMonth.of(2026, 1);
        stubTransactions(Map.of(
                previous, List.of(transaction("7999.90", previous, TransactionType.INCOME),
                        transaction("0.10", previous, TransactionType.INCOME),
                        transaction("4000.00", previous, TransactionType.EXPENSE),
                        transaction("500.00", previous, TransactionType.INVESTMENT)),
                current, List.of(transaction("8499.90", current, TransactionType.INCOME),
                        transaction("0.10", current, TransactionType.INCOME),
                        transaction("3000.00", current, TransactionType.EXPENSE),
                        transaction("1000.00", current, TransactionType.INVESTMENT))));

        DashboardComparisonResponse response = service.comparison(2026, 1);

        assertThat(response.currentPeriod()).isEqualTo("2026-01");
        assertThat(response.previousPeriod()).isEqualTo("2025-12");
        assertMetric(response.metrics().income(), "8500", "8000", "500", "6.25");
        assertMetric(response.metrics().expense(), "3000", "4000", "-1000", "-25.00");
        assertMetric(response.metrics().balance(), "4500", "3500", "1000", "28.57");
        assertMetric(response.metrics().investment(), "1000", "500", "500", "100.00");
        verify(fixedEntryService).materialize(previous);
        verify(fixedEntryService).materialize(current);
    }

    @ParameterizedTest
    @MethodSource("percentageCases")
    void calculatesPercentageChangeWithBigDecimal(String currentAmount, String previousAmount,
            String expectedDifference, String expectedPercentage) {
        YearMonth previous = YearMonth.of(2026, 8);
        YearMonth current = YearMonth.of(2026, 9);
        stubTransactions(Map.of(
                previous, List.of(transaction(previousAmount, previous, TransactionType.INCOME)),
                current, List.of(transaction(currentAmount, current, TransactionType.INCOME))));

        MetricComparison income = service.comparison(2026, 9).metrics().income();

        assertMetric(income, currentAmount, previousAmount, expectedDifference, expectedPercentage);
    }

    static Stream<Arguments> percentageCases() {
        return Stream.of(
                Arguments.of("8500", "8000", "500", "6.25"),
                Arguments.of("80", "100", "-20", "-20.00"),
                Arguments.of("100", "100", "0", "0"),
                Arguments.of("0", "0.00", "0.00", "0"),
                Arguments.of("100", "0", "100", null),
                Arguments.of("0", "100", "-100", "-100.00"),
                Arguments.of("4", "3", "1", "33.33"),
                Arguments.of("33", "32", "1", "3.13"));
    }

    @Test
    void preservesTheSignOfNegativeBalanceDenominator() {
        YearMonth previous = YearMonth.of(2026, 8);
        YearMonth current = YearMonth.of(2026, 9);
        stubTransactions(Map.of(
                previous, List.of(transaction("100.00", previous, TransactionType.EXPENSE)),
                current, List.of(transaction("50.00", current, TransactionType.EXPENSE))));

        MetricComparison balance = service.comparison(2026, 9).metrics().balance();

        assertMetric(balance, "-50", "-100", "50", "-50.00");
    }

    @Test
    void preservesTheSignWhenBalanceChangesFromNegativeToPositive() {
        YearMonth previous = YearMonth.of(2026, 8);
        YearMonth current = YearMonth.of(2026, 9);
        stubTransactions(Map.of(
                previous, List.of(transaction("100.00", previous, TransactionType.EXPENSE)),
                current, List.of(transaction("100.00", current, TransactionType.INCOME))));

        MetricComparison balance = service.comparison(2026, 9).metrics().balance();

        assertMetric(balance, "100", "-100", "200", "-200.00");
    }

    @ParameterizedTest
    @org.junit.jupiter.params.provider.EnumSource(value = TransactionType.class, names = {"EXPENSE", "INVESTMENT"})
    void returnsNullWhenNegativeBalanceHasNoPreviousValue(TransactionType outflow) {
        YearMonth previous = YearMonth.of(2026, 8);
        YearMonth current = YearMonth.of(2026, 9);
        stubTransactions(Map.of(
                previous, List.of(),
                current, List.of(transaction("1700.00", current, outflow))));

        MetricComparison balance = service.comparison(2026, 9).metrics().balance();

        assertMetric(balance, "-1700", "0", "-1700", null);
    }

    @Test
    void rejectsJanuaryOfYearOneBeforeMaterializingEitherPeriod() {
        assertThatThrownBy(() -> service.comparison(1, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");

        verifyNoInteractions(repository, fixedEntryService);
    }

    @Test
    void returnsSixMonthlyTotalsInChronologicalOrderAcrossTheYearBoundary() {
        YearMonth august = YearMonth.of(2025, 8);
        YearMonth january = YearMonth.of(2026, 1);
        stubTransactions(Map.of(
                august, List.of(transaction("100", august, TransactionType.INCOME)),
                january, List.of(transaction("40", january, TransactionType.EXPENSE),
                        transaction("20", january, TransactionType.INVESTMENT))));

        DashboardEvolutionResponse response = service.evolution(2026, 1);

        assertThat(response.startPeriod()).isEqualTo("2025-08");
        assertThat(response.endPeriod()).isEqualTo("2026-01");
        assertThat(response.points()).extracting(DashboardEvolutionPoint::period)
                .containsExactly("2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01");
        assertThat(response.points().getFirst().income()).isEqualByComparingTo("100");
        assertThat(response.points().get(1).income()).isZero();
        assertThat(response.points().get(5).expense()).isEqualByComparingTo("40");
        assertThat(response.points().get(5).investment()).isEqualByComparingTo("20");
        verify(fixedEntryService).materialize(YearMonth.of(2025, 8));
        verify(fixedEntryService).materialize(january);
    }

    @Test
    void rejectsIntervalsBeforeYearOneBeforeMaterializingAnyMonth() {
        assertThatThrownBy(() -> service.evolution(1, 5))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");

        verifyNoInteractions(repository, fixedEntryService);
    }

    private void stubTransactions(Map<YearMonth, List<FinancialTransaction>> transactions) {
        when(repository.findAllByOccurredOnBetween(any(LocalDate.class), any(LocalDate.class)))
                .thenAnswer(invocation -> transactions.getOrDefault(
                        YearMonth.from(invocation.getArgument(0, LocalDate.class)), List.of()));
    }

    private FinancialTransaction transaction(String amount, YearMonth month, TransactionType type) {
        return new FinancialTransaction(type.name(), new BigDecimal(amount), month.atDay(1), type);
    }

    private void assertMetric(MetricComparison metric, String current, String previous,
            String difference, String percentage) {
        assertThat(metric.current()).isEqualByComparingTo(current);
        assertThat(metric.previous()).isEqualByComparingTo(previous);
        assertThat(metric.absoluteChange()).isEqualByComparingTo(difference);
        if (percentage == null) {
            assertThat(metric.percentageChange()).isNull();
        } else {
            assertThat(metric.percentageChange()).isEqualByComparingTo(percentage);
        }
    }
}
