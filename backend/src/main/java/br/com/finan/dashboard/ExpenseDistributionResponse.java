package br.com.finan.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record ExpenseDistributionResponse(String period, BigDecimal totalExpense,
        List<ExpenseCategoryDistribution> categories) {
}
