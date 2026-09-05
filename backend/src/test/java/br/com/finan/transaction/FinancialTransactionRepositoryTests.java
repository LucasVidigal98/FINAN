package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class FinancialTransactionRepositoryTests {

    @Autowired
    private FinancialTransactionRepository repository;

    @PersistenceContext
    private EntityManager entityManager;

    @ParameterizedTest
    @EnumSource(TransactionType.class)
    void savesAndLoadsTransaction(TransactionType type) {
        FinancialTransaction transaction = new FinancialTransaction(
                "Lancamento manual", new BigDecimal("123.45"), LocalDate.of(2026, 9, 5), type);

        repository.saveAndFlush(transaction);
        entityManager.clear();

        FinancialTransaction loaded = repository.findById(transaction.getId()).orElseThrow();
        assertThat(loaded.getId()).isNotNull();
        assertThat(loaded.getDescription()).isEqualTo("Lancamento manual");
        assertThat(loaded.getAmount()).isEqualByComparingTo("123.45");
        assertThat(loaded.getOccurredOn()).isEqualTo(LocalDate.of(2026, 9, 5));
        assertThat(loaded.getType()).isEqualTo(type);
        assertThat(loaded.getSource()).isEqualTo(TransactionSource.MANUAL);
        assertThat(loaded.getCreatedAt()).isNotNull();
        assertThat(loaded.getUpdatedAt()).isEqualTo(loaded.getCreatedAt());

        var createdAt = loaded.getCreatedAt();
        loaded.setDescription("Lancamento atualizado");
        repository.flush();
        entityManager.clear();

        FinancialTransaction updated = repository.findById(transaction.getId()).orElseThrow();
        assertThat(updated.getDescription()).isEqualTo("Lancamento atualizado");
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
        assertThat(updated.getUpdatedAt()).isAfter(createdAt);
    }
}
