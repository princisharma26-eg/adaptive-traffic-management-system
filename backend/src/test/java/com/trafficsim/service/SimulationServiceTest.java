package com.trafficsim.service;

import com.trafficsim.algorithm.DensityBasedSignalAlgorithm;
import com.trafficsim.algorithm.FixedTimeSignalAlgorithm;
import com.trafficsim.algorithm.TrafficSignalAlgorithm.AlgorithmSignalResult;
import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.repository.InMemorySimulationRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SimulationServiceTest {

    private SimulationService simulationService;
    private DensityBasedSignalAlgorithm densityAlgorithm;

    @BeforeEach
    void setUp() {
        FixedTimeSignalAlgorithm fixedTimeAlgorithm = new FixedTimeSignalAlgorithm();
        densityAlgorithm = new DensityBasedSignalAlgorithm();
        InMemorySimulationRecordRepository repository = new InMemorySimulationRecordRepository();
        simulationService = new SimulationService(fixedTimeAlgorithm, densityAlgorithm, repository);
    }

    @Test
    @DisplayName("Should seamlessly switch between FIXED_TIME and DENSITY_BASED algorithm modes")
    void testSwitchAlgorithmMode() {
        // Default is FIXED_TIME
        assertEquals("FIXED_TIME", simulationService.getConfig().activeAlgorithm());
        AlgorithmSignalResult r1 = simulationService.getSignalStates(5.0);
        assertNotNull(r1);

        // Switch to DENSITY_BASED
        IntersectionConfig densityConfig = new IntersectionConfig(
            30.0, 30.0, 3.0, 1.0, 24, 1.0, "DENSITY_BASED", 12.0, 45.0
        );
        simulationService.updateConfig(densityConfig);
        assertEquals("DENSITY_BASED", simulationService.getConfig().activeAlgorithm());
        assertEquals(12.0, simulationService.getConfig().minGreenDuration());
        assertEquals(45.0, simulationService.getConfig().maxGreenDuration());

        // Update waiting counts
        simulationService.updateWaitingCounts(Map.of(
            Direction.NORTH, 8,
            Direction.SOUTH, 3,
            Direction.EAST, 4,
            Direction.WEST, 1
        ));

        AlgorithmSignalResult r2 = simulationService.getSignalStates(0.0);
        assertEquals("DENSITY_BASED", r2.activeAlgorithm());

        // Switch back to FIXED_TIME
        simulationService.updateConfig(IntersectionConfig.defaultPhase1());
        assertEquals("FIXED_TIME", simulationService.getConfig().activeAlgorithm());
        AlgorithmSignalResult r3 = simulationService.getSignalStates(5.0);
        assertEquals("FIXED_TIME", r3.activeAlgorithm());
    }
}
