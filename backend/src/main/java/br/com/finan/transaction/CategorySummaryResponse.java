package br.com.finan.transaction;

import java.util.UUID;

public record CategorySummaryResponse(
        UUID id,
        String name,
        String color
) {}
