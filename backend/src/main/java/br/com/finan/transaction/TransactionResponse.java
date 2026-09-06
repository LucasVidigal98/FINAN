package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate occurredOn,
        TransactionType type,
        TransactionSource source,
        CategorySummaryResponse category,
        Instant createdAt,
        Instant updatedAt
) {}
