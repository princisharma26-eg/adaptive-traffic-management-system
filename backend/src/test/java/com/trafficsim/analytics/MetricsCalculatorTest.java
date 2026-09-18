package com.trafficsim.analytics;

import com.trafficsim.model.Direction;
import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MetricsCalculatorTest {

    private MetricsCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new MetricsCalculator();
    }

    @Test
    @DisplayName("Should compute throughput as passed vehicles divided by elapsed minutes")
    void testThroughputCalculation() {
        // 30 passed in 120 seconds (2.0 minutes) -> 15.0 vehicles/min
        TelemetrySnapshot snapshot = new TelemetrySnapshot(
            120.0,
            40,
            30,
            5,
            Map.of(Direction.NORTH, 2, Direction.SOUTH, 1, Direction.EAST, 2, Direction.WEST, 0),
            Map.of(Direction.NORTH, 10, Direction.SOUTH, 10, Direction.EAST, 5, Direction.WEST, 5),
            12.5,
            5.2
        );

        SimulationMetrics metrics = calculator.calculateMetrics(snapshot);

        assertEquals(15.0, metrics.throughputPerMinute());
        assertEquals(5.2, metrics.averageWaitTimeSeconds());
        assertEquals(12.5, metrics.maxWaitTimeSeconds());
        assertEquals(5, metrics.currentQueueLength());
        assertEquals(30, metrics.totalPassed());
        assertTrue(metrics.fairnessIndex() > 0.8, "Fairness should be high with balanced traffic");
    }

    @Test
    @DisplayName("Should handle null and zero safely")
    void testZeroAndNullSafety() {
        SimulationMetrics empty = calculator.calculateMetrics(null);
        assertNotNull(empty);
        assertEquals(0.0, empty.throughputPerMinute());
        assertEquals(0, empty.totalPassed());
        assertEquals(1.0, empty.fairnessIndex());
    }
}
