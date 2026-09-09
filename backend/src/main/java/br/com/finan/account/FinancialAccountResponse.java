package br.com.finan.account;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import br.com.finan.transaction.TransactionSource;

public record FinancialAccountResponse(
        UUID id,
        String name,
        AccountType type,
        TransactionSource source,
        BigDecimal initialBalance,
        BigDecimal providerBalance,
        String externalId,
        boolean active,
        Instant lastSyncedAt,
        Instant createdAt,
        Instant updatedAt
) {}
