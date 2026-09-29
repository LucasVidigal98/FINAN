package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import br.com.finan.fixedentry.FixedEntry;
import br.com.finan.fixedentry.FixedEntryRepository;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class DashboardComparisonRollbackTests {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private CategoryRepository categories;

    @Autowired
    private FixedEntryRepository fixedEntries;

    @Autowired
    private FinancialTransactionRepository transactions;

    @Autowired
    private Clock clock;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private final List<FixedEntry> seededEntries = new ArrayList<>();
    private final List<Category> seededCategories = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            seededEntries.forEach(transactions::deleteAllByFixedEntry);
            transactions.flush();
            fixedEntries.deleteAllById(seededEntries.stream().map(FixedEntry::getId).toList());
            fixedEntries.flush();
            categories.deleteAllById(seededCategories.stream().map(Category::getId).toList());
            categories.flush();
        });
    }

    @Test
    void rollsBackPreviousPeriodMaterializationWhenCurrentPeriodFails() {
        YearMonth current = YearMonth.now(clock);
        YearMonth previous = current.minusMonths(1);
        Category validCategory = saveCategory(TransactionType.INCOME);
        Category mismatchedCategory = saveCategory(TransactionType.EXPENSE);
        FixedEntry validEntry = saveEntry("rollback-valid", TransactionType.INCOME, validCategory,
                previous);
        saveEntry("rollback-invalid", TransactionType.INCOME, mismatchedCategory, current);
        long transactionCountBefore = transactions.count();
        int previousTransactionCountBefore = transactions
                .findAllByOccurredOnBetween(previous.atDay(1), previous.atEndOfMonth()).size();

        assertThatThrownBy(() -> dashboardService.comparison(current.getYear(), current.getMonthValue()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Category type does not match fixed entry type");

        assertThat(transactions.count()).isEqualTo(transactionCountBefore);
        assertThat(transactions.findAllByOccurredOnBetween(previous.atDay(1), previous.atEndOfMonth()))
                .hasSize(previousTransactionCountBefore);
        assertThat(transactions.existsByFixedEntryAndFixedMonth(validEntry, previous.atDay(1))).isFalse();
    }

    private Category saveCategory(TransactionType type) {
        Category category = categories.saveAndFlush(
                new Category("RB-" + type + "-" + UUID.randomUUID(), type, null));
        seededCategories.add(category);
        return category;
    }

    private FixedEntry saveEntry(String description, TransactionType type, Category category,
            YearMonth startsIn) {
        FixedEntry entry = fixedEntries.saveAndFlush(new FixedEntry(description + " " + UUID.randomUUID(),
                BigDecimal.TEN, type, category, startsIn.atDay(1), startsIn.atDay(1)));
        seededEntries.add(entry);
        return entry;
    }
}
