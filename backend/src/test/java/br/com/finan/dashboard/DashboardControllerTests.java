package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Clock;
import java.time.YearMonth;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import br.com.finan.fixedentry.FixedEntry;
import br.com.finan.fixedentry.FixedEntryRepository;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FinancialTransactionRepository repository;

    @Autowired private CategoryRepository categories;
    @Autowired private FixedEntryRepository fixedEntries;
    @Autowired private Clock clock;

    @Test
    void comparesAllMetricsSubtractingInvestmentFromBalance() throws Exception {
        save("Anterior", "8000", LocalDate.of(2026, 8, 1), TransactionType.INCOME);
        save("Anterior", "4000", LocalDate.of(2026, 8, 31), TransactionType.EXPENSE);
        save("Atual", "8500", LocalDate.of(2026, 9, 1), TransactionType.INCOME);
        save("Atual", "3000", LocalDate.of(2026, 9, 30), TransactionType.EXPENSE);
        save("Atual", "1000", LocalDate.of(2026, 9, 15), TransactionType.INVESTMENT);
        var result = comparison(2026, 9)
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.currentPeriod").value("2026-09"))
                .andExpect(jsonPath("$.previousPeriod").value("2026-08"));
        String[] names = {"income", "expense", "balance", "investment"};
        int[][] amounts = {{8500, 8000, 500}, {3000, 4000, -1000}, {4500, 4000, 500}, {1000, 0, 1000}};
        Double[] percentages = {6.25, -25.0, 12.5, null};
        for (int i = 0; i < names.length; i++) {
            String path = "$.metrics." + names[i];
            result.andExpect(jsonPath(path + ".current").value(amounts[i][0]))
                    .andExpect(jsonPath(path + ".previous").value(amounts[i][1]))
                    .andExpect(jsonPath(path + ".absoluteChange").value(amounts[i][2]))
                    .andExpect(jsonPath(path + ".percentageChange").hasJsonPath());
            if (percentages[i] == null) result.andExpect(jsonPath(path + ".percentageChange").value(nullValue()));
            else result.andExpect(jsonPath(path + ".percentageChange").value(percentages[i]));
        }
        assertThat(result.andReturn().getResponse().getContentAsString()).doesNotContain("NaN", "Infinity");
    }

    @ParameterizedTest
    @CsvSource({"2026,1,2025-12", "2024,3,2024-02", "2024,2,2024-01"})
    void includesBothMonthBoundariesAndExcludesNeighbors(int year, int month, String previous) throws Exception {
        YearMonth current = YearMonth.of(year, month);
        YearMonth prior = current.minusMonths(1);
        for (LocalDate date : new LocalDate[] {prior.atDay(1), prior.atEndOfMonth(), current.atDay(1), current.atEndOfMonth()}) {
            save("Limite", "10", date, TransactionType.INCOME);
        }
        save("Fora", "999", prior.atDay(1).minusDays(1), TransactionType.INCOME);
        save("Fora", "999", current.atEndOfMonth().plusDays(1), TransactionType.INCOME);
        comparison(year, month).andExpect(jsonPath("$.previousPeriod").value(previous))
                .andExpect(jsonPath("$.metrics.income.current").value(20))
                .andExpect(jsonPath("$.metrics.income.previous").value(20))
                .andExpect(jsonPath("$.metrics.income.absoluteChange").value(0))
                .andExpect(jsonPath("$.metrics.income.percentageChange").value(0));
    }

    @ParameterizedTest
    @CsvSource({"0,0,0", "0,100,NULL", "100,0,-100"})
    void comparesEmptyMonths(int previous, int current, String percentage) throws Exception {
        if (previous > 0) save("Anterior", "100", LocalDate.of(2026, 8, 1), TransactionType.INCOME);
        if (current > 0) save("Atual", "100", LocalDate.of(2026, 9, 1), TransactionType.INCOME);
        var result = comparison(2026, 9);
        for (String metric : new String[] {"income", "expense", "balance", "investment"}) {
            boolean incomeOrBalance = metric.equals("income") || metric.equals("balance");
            String path = "$.metrics." + metric;
            result.andExpect(jsonPath(path + ".current").value(incomeOrBalance ? current : 0))
                    .andExpect(jsonPath(path + ".previous").value(incomeOrBalance ? previous : 0))
                    .andExpect(jsonPath(path + ".absoluteChange").value(incomeOrBalance ? current - previous : 0))
                    .andExpect(jsonPath(path + ".percentageChange").hasJsonPath());
            if (incomeOrBalance && percentage.equals("NULL")) {
                result.andExpect(jsonPath(path + ".percentageChange").value(nullValue()));
            } else {
                result.andExpect(jsonPath(path + ".percentageChange").value(incomeOrBalance ? Integer.parseInt(percentage) : 0));
            }
        }
    }

    @ParameterizedTest
    @CsvSource({"2026,0", "2026,13", "0,9", "-1,9", "10000,9", "1,1", "abc,9", "2026,abc", ",9", "2026,"})
    void rejectsInvalidComparisonBeforeMaterializing(String year, String month) throws Exception {
        createFixedEntry(LocalDate.of(1, 1, 1), LocalDate.of(1, 1, 1));
        var request = get("/api/dashboard/comparison");
        if (year != null) request.param("year", year);
        if (month != null) request.param("month", month);
        mvc.perform(request).andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @ParameterizedTest
    @CsvSource({"9999,12,9999-12,9999-11", "1,2,0001-02,0001-01"})
    void acceptsPeriodRangeBoundaries(int year, int month, String current, String previous) throws Exception {
        comparison(year, month).andExpect(jsonPath("$.currentPeriod").value(current))
                .andExpect(jsonPath("$.previousPeriod").value(previous));
    }

    @Test
    void materializesEligibleFixedEntriesForBothMonthsOnlyOnceAndExcludesInactive() throws Exception {
        LocalDate current = LocalDate.now(clock).withDayOfMonth(1);
        FixedEntry entry = createFixedEntry(current.minusMonths(1), current.minusMonths(1));
        for (int i = 0; i < 2; i++) {
            comparison(current.getYear(), current.getMonthValue())
                    .andExpect(jsonPath("$.metrics.income.current").value(100))
                    .andExpect(jsonPath("$.metrics.income.previous").value(100));
        }
        assertThat(repository.count()).isEqualTo(2);
        entry.deactivate();
        fixedEntries.flush();
        comparison(current.getYear(), current.getMonthValue())
                .andExpect(jsonPath("$.metrics.income.current").value(0))
                .andExpect(jsonPath("$.metrics.income.previous").value(0));
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void doesNotRecoverIneligibleHistoryOrGenerateFutureFixedEntries() throws Exception {
        LocalDate current = LocalDate.now(clock).withDayOfMonth(1);
        createFixedEntry(current.minusMonths(1), current);
        comparison(current.getYear(), current.getMonthValue())
                .andExpect(jsonPath("$.metrics.income.current").value(100))
                .andExpect(jsonPath("$.metrics.income.previous").value(0));
        LocalDate next = current.plusMonths(1);
        comparison(next.getYear(), next.getMonthValue())
                .andExpect(jsonPath("$.metrics.income.current").value(0))
                .andExpect(jsonPath("$.metrics.income.previous").value(100));
        assertThat(repository.count()).isEqualTo(1);
    }

    private FixedEntry createFixedEntry(LocalDate startsOn, LocalDate eligibleFrom) {
        Category category = categories.saveAndFlush(new Category("Comparativo", TransactionType.INCOME, null));
        return fixedEntries.saveAndFlush(new FixedEntry("Fixo", new BigDecimal("100"),
                TransactionType.INCOME, category, startsOn, eligibleFrom));
    }

    private org.springframework.test.web.servlet.ResultActions comparison(int year, int month) throws Exception {
        return mvc.perform(get("/api/dashboard/comparison").param("year", Integer.toString(year))
                .param("month", Integer.toString(month))).andExpect(status().isOk());
    }

    @Test
    void calculatesMonthlySummary() throws Exception {
        save("Salario", "8500.00", LocalDate.of(2026, 9, 1), TransactionType.INCOME);
        save("Despesas", "2350.00", LocalDate.of(2026, 9, 15), TransactionType.EXPENSE);
        save("Investimento", "1000.00", LocalDate.of(2026, 9, 30), TransactionType.INVESTMENT);

        mvc.perform(get("/api/dashboard/monthly").param("year", "2026").param("month", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year").value(2026))
                .andExpect(jsonPath("$.month").value(9))
                .andExpect(jsonPath("$.totalIncome").value(8500.00))
                .andExpect(jsonPath("$.totalExpense").value(2350.00))
                .andExpect(jsonPath("$.totalInvestment").value(1000.00))
                .andExpect(jsonPath("$.availableBalance").value(5150.00))
                .andExpect(jsonPath("$.transactionCount").value(3));
    }

    @Test
    void ignoresTransactionsFromOtherMonths() throws Exception {
        save("Agosto", "100.00", LocalDate.of(2026, 8, 31), TransactionType.INCOME);
        save("Setembro", "50.00", LocalDate.of(2026, 9, 1), TransactionType.EXPENSE);
        save("Outubro", "200.00", LocalDate.of(2026, 10, 1), TransactionType.INCOME);

        mvc.perform(get("/api/dashboard/monthly").param("year", "2026").param("month", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(0))
                .andExpect(jsonPath("$.totalExpense").value(50.00))
                .andExpect(jsonPath("$.transactionCount").value(1));
    }

    @Test
    void returnsZerosForEmptyMonth() throws Exception {
        mvc.perform(get("/api/dashboard/monthly").param("year", "2026").param("month", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(0))
                .andExpect(jsonPath("$.totalExpense").value(0))
                .andExpect(jsonPath("$.totalInvestment").value(0))
                .andExpect(jsonPath("$.availableBalance").value(0))
                .andExpect(jsonPath("$.transactionCount").value(0));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 13})
    void rejectsInvalidMonth(int month) throws Exception {
        mvc.perform(get("/api/dashboard/monthly").param("year", "2026")
                        .param("month", Integer.toString(month)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidYear() throws Exception {
        mvc.perform(get("/api/dashboard/monthly").param("year", "0").param("month", "9"))
                .andExpect(status().isBadRequest());
    }

    private void save(String description, String amount, LocalDate occurredOn, TransactionType type) {
        repository.save(new FinancialTransaction(description, new BigDecimal(amount), occurredOn, type));
    }
}
