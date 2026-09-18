package com.trafficsim.algorithm;

import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.TrafficSignalState;
import com.trafficsim.simulation.SignalPhase;

import java.util.Map;

public interface TrafficSignalAlgorithm {
    String getName();

    AlgorithmSignalResult computeSignalStates(double elapsedSimulationSeconds, IntersectionConfig config);

    record AlgorithmSignalResult(
        SignalPhase activePhase,
        double cycleElapsedSeconds,
        double totalCycleSeconds,
        Map<Direction, TrafficSignalState> signals
    ) {}
}
