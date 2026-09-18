package br.com.finan.fixedentry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.finan.transaction.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFixedEntryRequest(
        @NotBlank @Size(max = 150) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull TransactionType type,
        @NotNull UUID categoryId,
        @NotNull LocalDate startsOn
) {}
