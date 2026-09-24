package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record LargestExpense(UUID id, String description, BigDecimal amount, LocalDate occurredOn,
        String categoryName) {
}
