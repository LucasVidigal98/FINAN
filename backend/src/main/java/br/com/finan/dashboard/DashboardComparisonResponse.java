package br.com.finan.dashboard;

public record DashboardComparisonResponse(
        String currentPeriod,
        String previousPeriod,
        ComparisonMetrics metrics) {
}
