package com.trafficsim.repository;

import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;

import java.util.List;
import java.util.Optional;

public interface SimulationRecordRepository {
    void saveTelemetrySnapshot(TelemetrySnapshot snapshot);
    Optional<TelemetrySnapshot> getLatestSnapshot();
    List<TelemetrySnapshot> getRecentSnapshots(int limit);
    void saveMetrics(SimulationMetrics metrics);
    Optional<SimulationMetrics> getLatestMetrics();
    void clear();
}
