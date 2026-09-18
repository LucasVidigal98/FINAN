package br.com.finan.fixedentry;

import jakarta.validation.constraints.NotNull;

public record UpdateFixedEntryActiveRequest(@NotNull Boolean active) {}
