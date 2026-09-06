package br.com.finan.dashboard;

import java.math.BigDecimal;

public record MonthlySummaryResponse(
        int year,
        int month,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal totalInvestment,
        BigDecimal availableBalance,
        long transactionCount) {
}
