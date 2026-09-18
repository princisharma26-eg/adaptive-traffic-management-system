package com.trafficsim.algorithm;

import com.trafficsim.algorithm.TrafficSignalAlgorithm.AlgorithmSignalResult;
import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SignalColor;
import com.trafficsim.simulation.SignalPhase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FixedTimeSignalAlgorithmTest {

    private FixedTimeSignalAlgorithm algorithm;
    private IntersectionConfig config;

    @BeforeEach
    void setUp() {
        algorithm = new FixedTimeSignalAlgorithm();
        // 30s NS green, 30s EW green, 3s yellow, 1s all-red
        config = IntersectionConfig.defaultPhase1();
    }

    @Test
    @DisplayName("Should maintain North/South GREEN and East/West RED during first 30 seconds")
    void testNorthSouthGreenPhase() {
        // At t = 10.0s (inside 30s NS green)
        AlgorithmSignalResult result = algorithm.computeSignalStates(10.0, config);

        assertEquals(SignalPhase.NORTH_SOUTH_GREEN, result.activePhase());
        assertEquals(SignalColor.GREEN, result.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.GREEN, result.signals().get(Direction.SOUTH).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.EAST).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.WEST).color());

        // 30 - 10 = 20.0s remaining for NS
        assertEquals(20.0, result.signals().get(Direction.NORTH).remainingSeconds());
        assertEquals(20.0, result.signals().get(Direction.SOUTH).remainingSeconds());
    }

    @Test
    @DisplayName("Should transition to North/South YELLOW between 30s and 33s")
    void testNorthSouthYellowPhase() {
        AlgorithmSignalResult result = algorithm.computeSignalStates(31.5, config);

        assertEquals(SignalPhase.NORTH_SOUTH_YELLOW, result.activePhase());
        assertEquals(SignalColor.YELLOW, result.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.YELLOW, result.signals().get(Direction.SOUTH).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.EAST).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.WEST).color());
        assertEquals(1.5, result.signals().get(Direction.NORTH).remainingSeconds());
    }

    @Test
    @DisplayName("Should transition to ALL_RED clearance between 33s and 34s")
    void testAllRedPhase() {
        AlgorithmSignalResult result = algorithm.computeSignalStates(33.5, config);

        assertEquals(SignalPhase.ALL_RED_1, result.activePhase());
        assertEquals(SignalColor.RED, result.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.SOUTH).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.EAST).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.WEST).color());
    }

    @Test
    @DisplayName("Should maintain East/West GREEN and North/South RED between 34s and 64s")
    void testEastWestGreenPhase() {
        AlgorithmSignalResult result = algorithm.computeSignalStates(45.0, config);

        assertEquals(SignalPhase.EAST_WEST_GREEN, result.activePhase());
        assertEquals(SignalColor.RED, result.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.RED, result.signals().get(Direction.SOUTH).color());
        assertEquals(SignalColor.GREEN, result.signals().get(Direction.EAST).color());
        assertEquals(SignalColor.GREEN, result.signals().get(Direction.WEST).color());

        // 64 - 45 = 19.0s remaining
        assertEquals(19.0, result.signals().get(Direction.EAST).remainingSeconds());
        assertEquals(19.0, result.signals().get(Direction.WEST).remainingSeconds());
    }

    @Test
    @DisplayName("Should repeat cycle accurately after total cycle time (68s)")
    void testCycleWrapping() {
        double totalCycle = config.getTotalCycleDuration(); // 30 + 3 + 1 + 30 + 3 + 1 = 68s
        // At t = 68.0 + 5.0 = 73.0s
        AlgorithmSignalResult result = algorithm.computeSignalStates(totalCycle + 5.0, config);

        assertEquals(SignalPhase.NORTH_SOUTH_GREEN, result.activePhase());
        assertEquals(SignalColor.GREEN, result.signals().get(Direction.NORTH).color());
        assertEquals(25.0, result.signals().get(Direction.NORTH).remainingSeconds());
    }
}
