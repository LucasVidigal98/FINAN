package br.com.finan.fixedentry;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FixedEntryServiceTests {

    @Test
    void materializesCurrentMonthEntryCreatedAfterItsDueDate() {
        FixedEntryRepository fixedEntryRepository = mock(FixedEntryRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        FinancialTransactionRepository transactionRepository = mock(FinancialTransactionRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-09-15T12:00:00Z"), ZoneOffset.UTC);
        Category category = new Category("Salario", TransactionType.INCOME, "#000000");
        FixedEntry fixedEntry = new FixedEntry("Salario", new BigDecimal("6500.00"), TransactionType.INCOME,
                category, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 15));
        when(fixedEntryRepository.findAllActiveForUpdate()).thenReturn(List.of(fixedEntry));
        when(categoryRepository.findById(any())).thenReturn(Optional.of(category));

        new FixedEntryService(fixedEntryRepository, categoryRepository, transactionRepository, clock)
                .materialize(YearMonth.of(2026, 9));

        verify(transactionRepository).save(any(FinancialTransaction.class));
    }
}
