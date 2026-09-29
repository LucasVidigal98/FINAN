package br.com.finan.dashboard;

import java.math.BigDecimal;

public record DashboardEvolutionPoint(
        String period,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal investment) {
}
