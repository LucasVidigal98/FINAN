package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.function.Consumer;
import java.util.stream.Stream;

import jakarta.validation.Validation;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialTransactionValidationTests {

    @ParameterizedTest
    @MethodSource("invalidTransactions")
    void rejectsInvalidFields(String field, Consumer<FinancialTransaction> mutation) {
        FinancialTransaction transaction = new FinancialTransaction(
                "Salario", new BigDecimal("100.00"), LocalDate.of(2026, 9, 5), TransactionType.INCOME);
        mutation.accept(transaction);

        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(transaction))
                    .anyMatch(violation -> violation.getPropertyPath().toString().equals(field));
        }
    }

    static Stream<Arguments> invalidTransactions() {
        return Stream.of(
                invalid("description", t -> t.setDescription(null)),
                invalid("description", t -> t.setDescription(" \t\n")),
                invalid("description", t -> t.setDescription("a".repeat(151))),
                invalid("amount", t -> t.setAmount(null)),
                invalid("amount", t -> t.setAmount(BigDecimal.ZERO)),
                invalid("amount", t -> t.setAmount(new BigDecimal("-1.00"))),
                invalid("occurredOn", t -> t.setOccurredOn(null)),
                invalid("type", t -> t.setType(null)),
                invalid("source", t -> t.setSource(null)));
    }

    private static Arguments invalid(String field, Consumer<FinancialTransaction> mutation) {
        return Arguments.of(field, mutation);
    }
}
