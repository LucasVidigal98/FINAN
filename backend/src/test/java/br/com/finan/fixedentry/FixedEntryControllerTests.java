package br.com.finan.fixedentry;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FixedEntryControllerTests {

    @Autowired private MockMvc mvc;
    @Autowired private FixedEntryRepository fixedEntries;
    @Autowired private FinancialTransactionRepository transactions;
    @Autowired private CategoryRepository categories;
    @Autowired private Clock clock;

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void deletesFixedEntryAndOnlyItsGeneratedTransactions(boolean active) throws Exception {
        LocalDate month = LocalDate.now(clock).withDayOfMonth(1);
        FixedEntry entry = createEntry(TransactionType.EXPENSE, month.minusMonths(1));
        FinancialTransaction previous = generate(entry, month.minusMonths(1));
        FinancialTransaction current = generate(entry, month);
        FixedEntry otherEntry = createEntry(TransactionType.INCOME, month);
        FinancialTransaction other = generate(otherEntry, month);
        FinancialTransaction manual = transactions.saveAndFlush(new FinancialTransaction(
                "Manual", BigDecimal.TEN, month, TransactionType.EXPENSE));
        if (!active) entry.deactivate();

        mvc.perform(delete("/api/fixed-entries/{id}", entry.getId()))
                .andExpect(status().isNoContent());
        fixedEntries.flush();

        assertThat(fixedEntries.existsById(entry.getId())).isFalse();
        assertThat(transactions.existsById(previous.getId())).isFalse();
        assertThat(transactions.existsById(current.getId())).isFalse();
        assertThat(transactions.existsById(other.getId())).isTrue();
        assertThat(transactions.existsById(manual.getId())).isTrue();
        mvc.perform(delete("/api/fixed-entries/{id}", entry.getId()))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @EnumSource(value = TransactionType.class, names = {"INCOME", "EXPENSE"})
    void excludesInactiveEntriesFromCurrentAndPastSummariesWithoutDuplicatingOnReactivation(
            TransactionType type) throws Exception {
        LocalDate month = LocalDate.now(clock).withDayOfMonth(1);
        FixedEntry entry = createEntry(type, month.minusMonths(1));
        generate(entry, month.minusMonths(1));
        generate(entry, month);
        for (LocalDate date : new LocalDate[] {month.minusMonths(1), month}) {
            transactions.saveAndFlush(new FinancialTransaction("Manual", BigDecimal.TEN, date, type));
            assertSummary(date, type, 110, 2);
        }

        setActive(entry, false);
        for (LocalDate date : new LocalDate[] {month.minusMonths(1), month}) {
            assertSummary(date, type, 10, 1);
        }
        assertThat(transactions.count()).isEqualTo(4);

        setActive(entry, true);
        for (LocalDate date : new LocalDate[] {month.minusMonths(1), month}) {
            assertSummary(date, type, 110, 2);
            assertSummary(date, type, 110, 2);
        }
        assertThat(transactions.count()).isEqualTo(4);
    }

    private FixedEntry createEntry(TransactionType type, LocalDate startsOn) {
        Category category = categories.saveAndFlush(new Category("Fixo " + type, type, null));
        return fixedEntries.saveAndFlush(new FixedEntry("Fixo", new BigDecimal("100.00"),
                type, category, startsOn, startsOn));
    }

    private FinancialTransaction generate(FixedEntry entry, LocalDate month) {
        FinancialTransaction transaction = new FinancialTransaction(entry.getDescription(),
                entry.getAmount(), month, entry.getType());
        transaction.setCategory(entry.getCategory());
        transaction.setFixedEntry(entry);
        transaction.setFixedMonth(month);
        return transactions.saveAndFlush(transaction);
    }

    private void setActive(FixedEntry entry, boolean active) throws Exception {
        mvc.perform(patch("/api/fixed-entries/{id}/active", entry.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":" + active + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(active));
    }

    private void assertSummary(LocalDate date, TransactionType type, int total, int count) throws Exception {
        mvc.perform(get("/api/dashboard/monthly")
                        .param("year", Integer.toString(date.getYear()))
                        .param("month", Integer.toString(date.getMonthValue())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(type == TransactionType.INCOME ? total : 0))
                .andExpect(jsonPath("$.totalExpense").value(type == TransactionType.EXPENSE ? total : 0))
                .andExpect(jsonPath("$.availableBalance").value(type == TransactionType.INCOME ? total : -total))
                .andExpect(jsonPath("$.transactionCount").value(count));
    }
}
