package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTransactionRequest(
        @NotBlank @Size(max = 150) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull LocalDate occurredOn,
        @NotNull TransactionType type,
        UUID categoryId,
        UUID accountId
) {}
