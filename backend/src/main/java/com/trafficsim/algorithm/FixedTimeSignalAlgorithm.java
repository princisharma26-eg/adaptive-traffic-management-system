package com.trafficsim.algorithm;

import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SignalColor;
import com.trafficsim.model.TrafficSignalState;
import com.trafficsim.simulation.SignalPhase;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component("fixedTimeSignalAlgorithm")
public class FixedTimeSignalAlgorithm implements TrafficSignalAlgorithm {

    @Override
    public String getName() {
        return "FIXED_TIME";
    }

    @Override
    public AlgorithmSignalResult computeSignalStates(double elapsedSimulationSeconds, IntersectionConfig config) {
        double nsGreen = config.northSouthGreenDuration();
        double yellow = config.yellowDuration();
        double allRed = config.allRedDuration();
        double ewGreen = config.eastWestGreenDuration();

        double phase1End = nsGreen;
        double phase2End = phase1End + yellow;
        double phase3End = phase2End + allRed;
        double phase4End = phase3End + ewGreen;
        double phase5End = phase4End + yellow;
        double totalCycle = phase5End + allRed;

        // Modulo inside the current cycle
        double cycleElapsed = totalCycle > 0 ? (elapsedSimulationSeconds % totalCycle) : 0;
        if (cycleElapsed < 0) {
            cycleElapsed += totalCycle;
        }

        SignalPhase activePhase;
        SignalColor nsColor;
        SignalColor ewColor;
        double nsRemaining;
        double ewRemaining;

        if (cycleElapsed < phase1End) {
            // North-South Green (30s)
            activePhase = SignalPhase.NORTH_SOUTH_GREEN;
            nsColor = SignalColor.GREEN;
            ewColor = SignalColor.RED;
            nsRemaining = phase1End - cycleElapsed;
            // EW remains red until phase3End
            ewRemaining = phase3End - cycleElapsed;
        } else if (cycleElapsed < phase2End) {
            // North-South Yellow (3s)
            activePhase = SignalPhase.NORTH_SOUTH_YELLOW;
            nsColor = SignalColor.YELLOW;
            ewColor = SignalColor.RED;
            nsRemaining = phase2End - cycleElapsed;
            ewRemaining = phase3End - cycleElapsed;
        } else if (cycleElapsed < phase3End) {
            // All Red clearance 1 (1s)
            activePhase = SignalPhase.ALL_RED_1;
            nsColor = SignalColor.RED;
            ewColor = SignalColor.RED;
            nsRemaining = totalCycle - cycleElapsed + phase1End; // until next NS green
            ewRemaining = phase3End - cycleElapsed; // until EW green
        } else if (cycleElapsed < phase4End) {
            // East-West Green (30s)
            activePhase = SignalPhase.EAST_WEST_GREEN;
            nsColor = SignalColor.RED;
            ewColor = SignalColor.GREEN;
            ewRemaining = phase4End - cycleElapsed;
            // NS remains red until end of cycle
            nsRemaining = totalCycle - cycleElapsed;
        } else if (cycleElapsed < phase5End) {
            // East-West Yellow (3s)
            activePhase = SignalPhase.EAST_WEST_YELLOW;
            nsColor = SignalColor.RED;
            ewColor = SignalColor.YELLOW;
            ewRemaining = phase5End - cycleElapsed;
            nsRemaining = totalCycle - cycleElapsed;
        } else {
            // All Red clearance 2 (1s)
            activePhase = SignalPhase.ALL_RED_2;
            nsColor = SignalColor.RED;
            ewColor = SignalColor.RED;
            ewRemaining = phase3End + (totalCycle - cycleElapsed);
            nsRemaining = totalCycle - cycleElapsed;
        }

        Map<Direction, TrafficSignalState> signals = new EnumMap<>(Direction.class);
        signals.put(Direction.NORTH, new TrafficSignalState(Direction.NORTH, nsColor, roundOneDecimal(nsRemaining)));
        signals.put(Direction.SOUTH, new TrafficSignalState(Direction.SOUTH, nsColor, roundOneDecimal(nsRemaining)));
        signals.put(Direction.EAST, new TrafficSignalState(Direction.EAST, ewColor, roundOneDecimal(ewRemaining)));
        signals.put(Direction.WEST, new TrafficSignalState(Direction.WEST, ewColor, roundOneDecimal(ewRemaining)));

        return new AlgorithmSignalResult(
            activePhase,
            roundOneDecimal(cycleElapsed),
            roundOneDecimal(totalCycle),
            signals
        );
    }

    private double roundOneDecimal(double value) {
        return Math.round(Math.max(0.0, value) * 10.0) / 10.0;
    }
}
