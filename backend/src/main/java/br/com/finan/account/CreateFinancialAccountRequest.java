package br.com.finan.account;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFinancialAccountRequest(
        @NotBlank @Size(max = 80) String name,
        @NotNull AccountType type,
        @NotNull BigDecimal initialBalance
) {
    @JsonAnySetter
    public void rejectUnknownField(String name, Object value) {
        throw new IllegalArgumentException("Unknown field: " + name);
    }
}
