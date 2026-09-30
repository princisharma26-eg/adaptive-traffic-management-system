package com.trafficsim.algorithm;

import com.trafficsim.algorithm.TrafficSignalAlgorithm.AlgorithmSignalResult;
import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SignalColor;
import com.trafficsim.simulation.SignalPhase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class DensityBasedSignalAlgorithmTest {

    private DensityBasedSignalAlgorithm algorithm;
    private IntersectionConfig config;

    @BeforeEach
    void setUp() {
        algorithm = new DensityBasedSignalAlgorithm();
        config = IntersectionConfig.defaultPhase2(); // DENSITY_BASED, minGreen=10, maxGreen=40
    }

    @Test
    @DisplayName("Should dynamically calculate green duration bounded by minGreen and maxGreen")
    void testDynamicGreenDurationCalculation() {
        // Zero waiting -> minGreen (10.0s)
        double durationZero = algorithm.calculateDynamicGreenDuration(0, config);
        assertEquals(10.0, durationZero, 0.01);

        // 4 waiting -> 10.0 + 4 * 2.5 = 20.0s
        double durationFour = algorithm.calculateDynamicGreenDuration(4, config);
        assertEquals(20.0, durationFour, 0.01);

        // 8 waiting -> 10.0 + 8 * 2.5 = 30.0s
        double durationEight = algorithm.calculateDynamicGreenDuration(8, config);
        assertEquals(30.0, durationEight, 0.01);

        // 20 waiting -> 10.0 + 20 * 2.5 = 60.0s -> clamped to maxGreen (40.0s)
        double durationTwenty = algorithm.calculateDynamicGreenDuration(20, config);
        assertEquals(40.0, durationTwenty, 0.01);
    }

    @Test
    @DisplayName("Should ensure conflicting directions are NEVER simultaneously green")
    void testConflictSafety() {
        // Test a sequence of time points throughout phase cycles
        algorithm.updateWaitingCounts(Map.of(
            Direction.NORTH, 6,
            Direction.SOUTH, 2,
            Direction.EAST, 5,
            Direction.WEST, 3
        ));

        for (double t = 0.0; t <= 120.0; t += 1.0) {
            AlgorithmSignalResult result = algorithm.computeSignalStates(t, config);
            SignalColor northColor = result.signals().get(Direction.NORTH).color();
            SignalColor southColor = result.signals().get(Direction.SOUTH).color();
            SignalColor eastColor = result.signals().get(Direction.EAST).color();
            SignalColor westColor = result.signals().get(Direction.WEST).color();

            // Conflict rule: NS and EW cannot both be GREEN or YELLOW
            boolean nsActive = (northColor == SignalColor.GREEN || northColor == SignalColor.YELLOW
                             || southColor == SignalColor.GREEN || southColor == SignalColor.YELLOW);
            boolean ewActive = (eastColor == SignalColor.GREEN || eastColor == SignalColor.YELLOW
                             || westColor == SignalColor.GREEN || westColor == SignalColor.YELLOW);

            assertFalse(nsActive && ewActive,
                "Safety violation at t=" + t + "s: Conflicting directions are both active! NS: "
                + northColor + ", EW: " + eastColor);
        }
    }

    @Test
    @DisplayName("Should transition safely via YELLOW and ALL_RED clearance intervals")
    void testSafeClearanceTransitions() {
        // North has 0 waiting, so dynamic green is minGreen = 10.0s
        algorithm.updateWaitingCounts(Map.of(
            Direction.NORTH, 0,
            Direction.SOUTH, 0,
            Direction.EAST, 4,
            Direction.WEST, 2
        ));

        // Start at t = 0 -> NS Green for 10.0s
        AlgorithmSignalResult r0 = algorithm.computeSignalStates(0.0, config);
        assertEquals(SignalPhase.NORTH_SOUTH_GREEN, r0.activePhase());

        // At t = 10.5s -> inside NS Yellow (10.0s to 13.0s)
        AlgorithmSignalResult rYellow = algorithm.computeSignalStates(10.5, config);
        assertEquals(SignalPhase.NORTH_SOUTH_YELLOW, rYellow.activePhase());
        assertEquals(SignalColor.YELLOW, rYellow.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.RED, rYellow.signals().get(Direction.EAST).color());

        // At t = 13.5s -> inside ALL_RED_1 clearance (13.0s to 14.0s)
        AlgorithmSignalResult rAllRed = algorithm.computeSignalStates(13.5, config);
        assertEquals(SignalPhase.ALL_RED_1, rAllRed.activePhase());
        assertEquals(SignalColor.RED, rAllRed.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.RED, rAllRed.signals().get(Direction.EAST).color());

        // At t = 14.5s -> transitions to East-West Green!
        AlgorithmSignalResult rEw = algorithm.computeSignalStates(14.5, config);
        assertEquals(SignalPhase.EAST_WEST_GREEN, rEw.activePhase());
        assertEquals(SignalColor.RED, rEw.signals().get(Direction.NORTH).color());
        assertEquals(SignalColor.GREEN, rEw.signals().get(Direction.EAST).color());
    }

    @Test
    @DisplayName("Should prevent starvation: low density direction is guaranteed green service")
    void testPreventStarvation() {
        // Heavy traffic on NS (15 cars), light traffic on EW (1 car)
        algorithm.updateWaitingCounts(Map.of(
            Direction.NORTH, 15,
            Direction.SOUTH, 10,
            Direction.EAST, 1,
            Direction.WEST, 0
        ));

        // Initial phase: NS Green
        AlgorithmSignalResult rInit = algorithm.computeSignalStates(0.0, config);
        assertEquals(SignalPhase.NORTH_SOUTH_GREEN, rInit.activePhase());
        double nsGreenDuration = rInit.totalCycleSeconds(); // Max green 40.0s

        // Fast forward to end of NS green + yellow (3s) + allRed (1s)
        double tAfterClearance = nsGreenDuration + 3.0 + 1.0 + 0.5;

        // Even though NS still has 15 cars and EW only has 1 car, EW must NOT starve!
        AlgorithmSignalResult rNext = algorithm.computeSignalStates(tAfterClearance, config);
        assertEquals(SignalPhase.EAST_WEST_GREEN, rNext.activePhase(),
            "East-West must be served to prevent starvation even with only 1 waiting vehicle");
        assertEquals(SignalColor.GREEN, rNext.signals().get(Direction.EAST).color());
    }

    @Test
    @DisplayName("Should prioritize green duration for higher demand corridor")
    void testCorridorDemandAllocation() {
        // EW has heavy demand (12 cars), NS has moderate demand (2 cars)
        algorithm.updateWaitingCounts(Map.of(
            Direction.NORTH, 2,
            Direction.SOUTH, 1,
            Direction.EAST, 12,
            Direction.WEST, 8
        ));

        // Step through to EW green
        // t=0: NS has minGreen (10 + 2*2.5 = 15s)
        AlgorithmSignalResult nsResult = algorithm.computeSignalStates(0.0, config);
        assertEquals(15.0, nsResult.totalCycleSeconds(), 0.1);

        // Transition through Yellow (3s) + All Red (1s) = 19s
        AlgorithmSignalResult ewResult = algorithm.computeSignalStates(19.5, config);
        assertEquals(SignalPhase.EAST_WEST_GREEN, ewResult.activePhase());

        // EW green duration for 12 cars: clamp(10 + 12 * 2.5, 10, 40) = clamp(40.0, 10, 40) = 40.0s
        assertEquals(40.0, ewResult.totalCycleSeconds(), 0.1);
        assertEquals(40.0, algorithm.getLastAllocatedGreenDuration(), 0.1);
    }
}
