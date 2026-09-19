package br.com.finan.dashboard;

import java.math.BigDecimal;

public record MetricComparison(
        BigDecimal current,
        BigDecimal previous,
        BigDecimal absoluteChange,
        BigDecimal percentageChange) {
}
