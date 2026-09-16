package br.com.finan.fixedentry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import br.com.finan.transaction.TransactionType;

public record FixedEntryResponse(
        UUID id,
        String description,
        BigDecimal amount,
        TransactionType type,
        UUID categoryId,
        LocalDate startsOn,
        LocalDate eligibleFrom,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
