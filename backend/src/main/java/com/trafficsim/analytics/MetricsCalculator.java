package com.trafficsim.analytics;

import com.trafficsim.model.Direction;
import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
public class MetricsCalculator {

    public SimulationMetrics calculateMetrics(TelemetrySnapshot snapshot) {
        if (snapshot == null) {
            return emptyMetrics();
        }

        double simTimeMinutes = snapshot.simulationTimeSeconds() / 60.0;
        double throughput = simTimeMinutes > 0.05
            ? (snapshot.totalPassed() / simTimeMinutes)
            : 0.0;

        // Calculate Jain's Fairness Index for queue service across 4 directions
        // J = (sum(x_i))^2 / (n * sum(x_i^2))
        double fairness = calculateJainsFairnessIndex(snapshot.passedByDirection());

        Map<Direction, Integer> waitingMap = snapshot.waitingByDirection() != null
            ? snapshot.waitingByDirection()
            : defaultDirectionMap();

        Map<Direction, Integer> passedMap = snapshot.passedByDirection() != null
            ? snapshot.passedByDirection()
            : defaultDirectionMap();

        return new SimulationMetrics(
            roundTwoDecimals(throughput),
            roundOneDecimal(snapshot.averageWaitTimeSeconds()),
            roundOneDecimal(snapshot.maxWaitTimeSeconds()),
            snapshot.currentWaiting(),
            snapshot.totalSpawned(),
            snapshot.totalPassed(),
            roundOneDecimal(snapshot.simulationTimeSeconds()),
            waitingMap,
            passedMap,
            roundTwoDecimals(fairness)
        );
    }

    private double calculateJainsFairnessIndex(Map<Direction, Integer> passedByDirection) {
        if (passedByDirection == null || passedByDirection.isEmpty()) {
            return 1.0;
        }

        double sum = 0.0;
        double sumSq = 0.0;
        int n = passedByDirection.size();

        for (Integer val : passedByDirection.values()) {
            double v = val != null ? val : 0;
            sum += v;
            sumSq += (v * v);
        }

        if (sum == 0.0 || sumSq == 0.0) {
            return 1.0;
        }

        return (sum * sum) / (n * sumSq);
    }

    private Map<Direction, Integer> defaultDirectionMap() {
        Map<Direction, Integer> map = new EnumMap<>(Direction.class);
        for (Direction d : Direction.values()) {
            map.put(d, 0);
        }
        return map;
    }

    public SimulationMetrics emptyMetrics() {
        return new SimulationMetrics(
            0.0, 0.0, 0.0, 0, 0, 0, 0.0,
            defaultDirectionMap(),
            defaultDirectionMap(),
            1.0
        );
    }

    private double roundOneDecimal(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private double roundTwoDecimals(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
