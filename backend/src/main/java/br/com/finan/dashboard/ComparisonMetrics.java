package br.com.finan.dashboard;

public record ComparisonMetrics(
        MetricComparison income,
        MetricComparison expense,
        MetricComparison balance,
        MetricComparison investment) {
}
