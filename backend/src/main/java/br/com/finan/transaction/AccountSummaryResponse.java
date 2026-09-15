package br.com.finan.transaction;

import java.util.UUID;

import br.com.finan.account.AccountType;

public record AccountSummaryResponse(
        UUID id,
        String name,
        AccountType type,
        TransactionSource source
) {}
