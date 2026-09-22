package br.com.finan.dashboard;

import java.util.List;

public record DashboardEvolutionResponse(
        String startPeriod,
        String endPeriod,
        List<DashboardEvolutionPoint> points) {
}
