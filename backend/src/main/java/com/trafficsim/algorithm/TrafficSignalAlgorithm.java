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
        Map<Direction, TrafficSignalState> signals,
        String activeAlgorithm,
        String activeGreenDirection,
        double currentGreenDuration
    ) {
        public AlgorithmSignalResult(
            SignalPhase activePhase,
            double cycleElapsedSeconds,
            double totalCycleSeconds,
            Map<Direction, TrafficSignalState> signals
        ) {
            this(activePhase, cycleElapsedSeconds, totalCycleSeconds, signals, "FIXED_TIME", "", 0.0);
        }
    }
}
