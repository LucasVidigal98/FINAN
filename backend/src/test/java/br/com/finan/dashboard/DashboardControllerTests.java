package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FinancialTransactionRepository repository;

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
