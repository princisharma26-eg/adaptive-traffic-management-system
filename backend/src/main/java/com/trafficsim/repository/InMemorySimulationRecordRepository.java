package com.trafficsim.repository;

import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;

@Repository
public class InMemorySimulationRecordRepository implements SimulationRecordRepository {

    private final List<TelemetrySnapshot> snapshotHistory = new CopyOnWriteArrayList<>();
    private final AtomicReference<TelemetrySnapshot> latestSnapshot = new AtomicReference<>();
    private final AtomicReference<SimulationMetrics> latestMetrics = new AtomicReference<>();

    @Override
    public void saveTelemetrySnapshot(TelemetrySnapshot snapshot) {
        if (snapshot != null) {
            snapshotHistory.add(snapshot);
            latestSnapshot.set(snapshot);
            // Cap history to prevent unbounded memory growth in long sessions
            if (snapshotHistory.size() > 1000) {
                snapshotHistory.subList(0, snapshotHistory.size() - 800).clear();
            }
        }
    }

    @Override
    public Optional<TelemetrySnapshot> getLatestSnapshot() {
        return Optional.ofNullable(latestSnapshot.get());
    }

    @Override
    public List<TelemetrySnapshot> getRecentSnapshots(int limit) {
        int size = snapshotHistory.size();
        if (size == 0) return Collections.emptyList();
        int fromIndex = Math.max(0, size - limit);
        return new ArrayList<>(snapshotHistory.subList(fromIndex, size));
    }

    @Override
    public void saveMetrics(SimulationMetrics metrics) {
        latestMetrics.set(metrics);
    }

    @Override
    public Optional<SimulationMetrics> getLatestMetrics() {
        return Optional.ofNullable(latestMetrics.get());
    }

    @Override
    public void clear() {
        snapshotHistory.clear();
        latestSnapshot.set(null);
        latestMetrics.set(null);
    }
}
