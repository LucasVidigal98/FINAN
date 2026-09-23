package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseCategoryDistribution(UUID categoryId, String categoryName, BigDecimal amount,
        BigDecimal percentage) {
}
