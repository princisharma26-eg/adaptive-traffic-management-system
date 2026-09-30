package com.trafficsim.algorithm;

import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SignalColor;
import com.trafficsim.model.TrafficSignalState;
import com.trafficsim.simulation.SignalPhase;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component("densityBasedSignalAlgorithm")
public class DensityBasedSignalAlgorithm implements TrafficSignalAlgorithm {

    private final Map<Direction, Integer> waitingCounts = new ConcurrentHashMap<>();

    // FSM State Tracking
    private SignalPhase currentPhase = SignalPhase.NORTH_SOUTH_GREEN;
    private double phaseStartTime = 0.0;
    private double currentPhaseDuration = 30.0;
    private double lastEvaluatedTime = -1.0;

    // Starvation and consecutive phase counters
    private int nsConsecutiveGreens = 0;
    private int ewConsecutiveGreens = 0;
    private int nsStarvationCounter = 0;
    private int ewStarvationCounter = 0;

    private String activeGreenCorridor = "NORTH_SOUTH";
    private Direction dominantDirection = Direction.NORTH;
    private double lastAllocatedGreenDuration = 30.0;

    public DensityBasedSignalAlgorithm() {
        for (Direction dir : Direction.values()) {
            waitingCounts.put(dir, 0);
        }
    }

    @Override
    public String getName() {
        return "DENSITY_BASED";
    }

    /**
     * Updates the vehicle waiting counts per direction.
     */
    public void updateWaitingCounts(Map<Direction, Integer> counts) {
        if (counts != null) {
            for (Map.Entry<Direction, Integer> entry : counts.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    waitingCounts.put(entry.getKey(), Math.max(0, entry.getValue()));
                }
            }
        }
    }

    public Map<Direction, Integer> getWaitingCounts() {
        return new EnumMap<>(waitingCounts);
    }

    /**
     * Resets the internal state machine.
     */
    public synchronized void reset() {
        currentPhase = SignalPhase.NORTH_SOUTH_GREEN;
        phaseStartTime = 0.0;
        currentPhaseDuration = 30.0;
        lastEvaluatedTime = -1.0;
        nsConsecutiveGreens = 0;
        ewConsecutiveGreens = 0;
        nsStarvationCounter = 0;
        ewStarvationCounter = 0;
        activeGreenCorridor = "NORTH_SOUTH";
        dominantDirection = Direction.NORTH;
        lastAllocatedGreenDuration = 30.0;
        for (Direction dir : Direction.values()) {
            waitingCounts.put(dir, 0);
        }
    }

    /**
     * Computes the dynamic green duration based on vehicle waiting queue.
     * Formula: clamp(minGreen + queue * 2.5s, minGreen, maxGreen)
     */
    public double calculateDynamicGreenDuration(int queueCount, IntersectionConfig config) {
        double minGreen = config.minGreenDuration() > 0 ? config.minGreenDuration() : 10.0;
        double maxGreen = config.maxGreenDuration() >= minGreen ? config.maxGreenDuration() : 40.0;
        double calculated = minGreen + Math.max(0, queueCount) * 2.5;
        return Math.min(maxGreen, Math.max(minGreen, calculated));
    }

    @Override
    public synchronized AlgorithmSignalResult computeSignalStates(double elapsedSimulationSeconds, IntersectionConfig config) {
        // Detect simulation reset
        if (elapsedSimulationSeconds < lastEvaluatedTime - 1.0) {
            reset();
        }

        if (lastEvaluatedTime < 0) {
            // First evaluation: dynamically calculate initial phase duration from current traffic density
            int nsDemand = Math.max(waitingCounts.getOrDefault(Direction.NORTH, 0), waitingCounts.getOrDefault(Direction.SOUTH, 0));
            currentPhaseDuration = calculateDynamicGreenDuration(nsDemand, config);
            lastAllocatedGreenDuration = currentPhaseDuration;
        }
        lastEvaluatedTime = elapsedSimulationSeconds;

        // Advance state machine forward up to current elapsed time
        advanceStateMachine(elapsedSimulationSeconds, config);

        double phaseElapsed = Math.max(0.0, elapsedSimulationSeconds - phaseStartTime);
        double phaseRemaining = Math.max(0.0, currentPhaseDuration - phaseElapsed);

        SignalColor nsColor;
        SignalColor ewColor;
        double nsRemaining;
        double ewRemaining;

        double yellow = config.yellowDuration() > 0 ? config.yellowDuration() : 3.0;
        double allRed = config.allRedDuration() > 0 ? config.allRedDuration() : 1.0;

        switch (currentPhase) {
            case NORTH_SOUTH_GREEN -> {
                nsColor = SignalColor.GREEN;
                ewColor = SignalColor.RED;
                nsRemaining = phaseRemaining;
                // EW waits for NS green remaining + yellow + allRed
                ewRemaining = phaseRemaining + yellow + allRed;
            }
            case NORTH_SOUTH_YELLOW -> {
                nsColor = SignalColor.YELLOW;
                ewColor = SignalColor.RED;
                nsRemaining = phaseRemaining;
                ewRemaining = phaseRemaining + allRed;
            }
            case ALL_RED_1 -> {
                nsColor = SignalColor.RED;
                ewColor = SignalColor.RED;
                nsRemaining = phaseRemaining + (activeGreenCorridor.equals("NORTH_SOUTH") ? 0.0 : 30.0);
                ewRemaining = phaseRemaining; // about to turn green for EW
            }
            case EAST_WEST_GREEN -> {
                nsColor = SignalColor.RED;
                ewColor = SignalColor.GREEN;
                ewRemaining = phaseRemaining;
                nsRemaining = phaseRemaining + yellow + allRed;
            }
            case EAST_WEST_YELLOW -> {
                nsColor = SignalColor.RED;
                ewColor = SignalColor.YELLOW;
                ewRemaining = phaseRemaining;
                nsRemaining = phaseRemaining + allRed;
            }
            case ALL_RED_2 -> {
                nsColor = SignalColor.RED;
                ewColor = SignalColor.RED;
                ewRemaining = phaseRemaining + (activeGreenCorridor.equals("EAST_WEST") ? 0.0 : 30.0);
                nsRemaining = phaseRemaining; // about to turn green for NS
            }
            default -> {
                nsColor = SignalColor.RED;
                ewColor = SignalColor.RED;
                nsRemaining = 0.0;
                ewRemaining = 0.0;
            }
        }

        Map<Direction, TrafficSignalState> signals = new EnumMap<>(Direction.class);
        signals.put(Direction.NORTH, new TrafficSignalState(Direction.NORTH, nsColor, roundOneDecimal(nsRemaining)));
        signals.put(Direction.SOUTH, new TrafficSignalState(Direction.SOUTH, nsColor, roundOneDecimal(nsRemaining)));
        signals.put(Direction.EAST, new TrafficSignalState(Direction.EAST, ewColor, roundOneDecimal(ewRemaining)));
        signals.put(Direction.WEST, new TrafficSignalState(Direction.WEST, ewColor, roundOneDecimal(ewRemaining)));

        return new AlgorithmSignalResult(
            currentPhase,
            roundOneDecimal(phaseElapsed),
            roundOneDecimal(currentPhaseDuration),
            signals,
            getName(),
            activeGreenCorridor,
            roundOneDecimal(lastAllocatedGreenDuration)
        );
    }

    /**
     * Progresses through phase intervals until phaseStartTime + currentPhaseDuration > elapsedSimulationSeconds.
     */
    private void advanceStateMachine(double targetTime, IntersectionConfig config) {
        double yellow = config.yellowDuration() > 0 ? config.yellowDuration() : 3.0;
        double allRed = config.allRedDuration() > 0 ? config.allRedDuration() : 1.0;

        // Loop handles large jumps or normal frame steps
        int safetyLoop = 0;
        while (targetTime >= phaseStartTime + currentPhaseDuration && safetyLoop < 100) {
            safetyLoop++;
            double transitionTime = phaseStartTime + currentPhaseDuration;

            switch (currentPhase) {
                case NORTH_SOUTH_GREEN -> {
                    currentPhase = SignalPhase.NORTH_SOUTH_YELLOW;
                    phaseStartTime = transitionTime;
                    currentPhaseDuration = yellow;
                }
                case NORTH_SOUTH_YELLOW -> {
                    currentPhase = SignalPhase.ALL_RED_1;
                    phaseStartTime = transitionTime;
                    currentPhaseDuration = allRed;
                }
                case ALL_RED_1 -> {
                    // Decide next green corridor
                    transitionToNextGreenCorridor(transitionTime, config, "ALL_RED_1");
                }
                case EAST_WEST_GREEN -> {
                    currentPhase = SignalPhase.EAST_WEST_YELLOW;
                    phaseStartTime = transitionTime;
                    currentPhaseDuration = yellow;
                }
                case EAST_WEST_YELLOW -> {
                    currentPhase = SignalPhase.ALL_RED_2;
                    phaseStartTime = transitionTime;
                    currentPhaseDuration = allRed;
                }
                case ALL_RED_2 -> {
                    // Decide next green corridor
                    transitionToNextGreenCorridor(transitionTime, config, "ALL_RED_2");
                }
            }
        }
    }

    /**
     * Evaluates density, priority, and starvation to select the next green corridor.
     */
    private void transitionToNextGreenCorridor(double transitionTime, IntersectionConfig config, String fromAllRed) {
        int northWaiting = waitingCounts.getOrDefault(Direction.NORTH, 0);
        int southWaiting = waitingCounts.getOrDefault(Direction.SOUTH, 0);
        int eastWaiting = waitingCounts.getOrDefault(Direction.EAST, 0);
        int westWaiting = waitingCounts.getOrDefault(Direction.WEST, 0);

        int nsDemand = Math.max(northWaiting, southWaiting);
        int ewDemand = Math.max(eastWaiting, westWaiting);

        // Identify direction with maximum overall demand
        dominantDirection = findDominantDirection(northWaiting, southWaiting, eastWaiting, westWaiting);

        boolean chooseNs;

        // 1. Starvation prevention checks
        if (ewStarvationCounter >= 1 && ewDemand > 0) {
            // East-West was starved while waiting vehicles exist -> MUST serve EW
            chooseNs = false;
        } else if (nsStarvationCounter >= 1 && nsDemand > 0) {
            // North-South was starved while waiting vehicles exist -> MUST serve NS
            chooseNs = true;
        } else if ("ALL_RED_1".equals(fromAllRed)) {
            // Coming from NS cycle: if EW has waiting cars, serve EW to ensure fairness
            if (ewDemand > 0) {
                chooseNs = false;
            } else if (nsDemand > 0) {
                // EW is completely empty, NS still has cars -> serve NS again
                chooseNs = true;
            } else {
                // Both empty -> standard alternating
                chooseNs = false;
            }
        } else {
            // Coming from EW cycle (ALL_RED_2): if NS has waiting cars, serve NS
            if (nsDemand > 0) {
                chooseNs = true;
            } else if (ewDemand > 0) {
                chooseNs = false;
            } else {
                // Both empty -> standard alternating
                chooseNs = true;
            }
        }

        // Apply consecutive green limits: do not grant > 2 consecutive greens if opposing has vehicles
        if (chooseNs && nsConsecutiveGreens >= 2 && ewDemand > 0) {
            chooseNs = false;
        } else if (!chooseNs && ewConsecutiveGreens >= 2 && nsDemand > 0) {
            chooseNs = true;
        }

        if (chooseNs) {
            currentPhase = SignalPhase.NORTH_SOUTH_GREEN;
            activeGreenCorridor = "NORTH_SOUTH";
            double greenDuration = calculateDynamicGreenDuration(nsDemand, config);
            currentPhaseDuration = greenDuration;
            lastAllocatedGreenDuration = greenDuration;
            phaseStartTime = transitionTime;

            nsConsecutiveGreens++;
            ewConsecutiveGreens = 0;

            if (ewDemand > 0) {
                ewStarvationCounter++;
            } else {
                ewStarvationCounter = 0;
            }
            nsStarvationCounter = 0;
        } else {
            currentPhase = SignalPhase.EAST_WEST_GREEN;
            activeGreenCorridor = "EAST_WEST";
            double greenDuration = calculateDynamicGreenDuration(ewDemand, config);
            currentPhaseDuration = greenDuration;
            lastAllocatedGreenDuration = greenDuration;
            phaseStartTime = transitionTime;

            ewConsecutiveGreens++;
            nsConsecutiveGreens = 0;

            if (nsDemand > 0) {
                nsStarvationCounter++;
            } else {
                nsStarvationCounter = 0;
            }
            ewStarvationCounter = 0;
        }
    }

    private Direction findDominantDirection(int n, int s, int e, int w) {
        int max = n;
        Direction dom = Direction.NORTH;
        if (s > max) {
            max = s;
            dom = Direction.SOUTH;
        }
        if (e > max) {
            max = e;
            dom = Direction.EAST;
        }
        if (w > max) {
            dom = Direction.WEST;
        }
        return dom;
    }

    public String getActiveGreenCorridor() {
        return activeGreenCorridor;
    }

    public Direction getDominantDirection() {
        return dominantDirection;
    }

    public double getLastAllocatedGreenDuration() {
        return lastAllocatedGreenDuration;
    }

    public int getNsStarvationCounter() {
        return nsStarvationCounter;
    }

    public int getEwStarvationCounter() {
        return ewStarvationCounter;
    }

    private double roundOneDecimal(double value) {
        return Math.round(Math.max(0.0, value) * 10.0) / 10.0;
    }
}
