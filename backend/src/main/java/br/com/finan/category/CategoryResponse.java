package br.com.finan.category;

import java.util.UUID;

import br.com.finan.transaction.TransactionType;

public record CategoryResponse(
        UUID id,
        String name,
        TransactionType type,
        String color,
        boolean active
) {}
