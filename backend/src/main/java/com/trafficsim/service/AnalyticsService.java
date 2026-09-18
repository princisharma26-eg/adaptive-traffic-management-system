package com.trafficsim.service;

import com.trafficsim.analytics.MetricsCalculator;
import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import com.trafficsim.repository.SimulationRecordRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    private final MetricsCalculator metricsCalculator;
    private final SimulationRecordRepository repository;

    public AnalyticsService(MetricsCalculator metricsCalculator, SimulationRecordRepository repository) {
        this.metricsCalculator = metricsCalculator;
        this.repository = repository;
    }

    public SimulationMetrics recordTelemetry(TelemetrySnapshot snapshot) {
        if (snapshot == null) {
            return metricsCalculator.emptyMetrics();
        }

        repository.saveTelemetrySnapshot(snapshot);
        SimulationMetrics metrics = metricsCalculator.calculateMetrics(snapshot);
        repository.saveMetrics(metrics);
        return metrics;
    }

    public SimulationMetrics getLiveMetrics() {
        return repository.getLatestMetrics().orElseGet(() ->
            repository.getLatestSnapshot()
                .map(metricsCalculator::calculateMetrics)
                .orElseGet(metricsCalculator::emptyMetrics)
        );
    }

    public List<TelemetrySnapshot> getRecentHistory(int limit) {
        return repository.getRecentSnapshots(limit);
    }
}
