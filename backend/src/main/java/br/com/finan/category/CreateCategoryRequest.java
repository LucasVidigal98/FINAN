package br.com.finan.category;

import br.com.finan.transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 50) String name,
        @NotNull TransactionType type,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String color
) {}
