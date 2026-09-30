package com.trafficsim.service;

import com.trafficsim.algorithm.DensityBasedSignalAlgorithm;
import com.trafficsim.algorithm.FixedTimeSignalAlgorithm;
import com.trafficsim.algorithm.TrafficSignalAlgorithm;
import com.trafficsim.algorithm.TrafficSignalAlgorithm.AlgorithmSignalResult;
import com.trafficsim.model.Direction;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SimulationControlRequest;
import com.trafficsim.repository.SimulationRecordRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class SimulationService {

    private final Map<String, TrafficSignalAlgorithm> algorithms = new ConcurrentHashMap<>();
    private final AtomicReference<IntersectionConfig> config = new AtomicReference<>(IntersectionConfig.defaultPhase1());
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicReference<Double> currentSpeed = new AtomicReference<>(1.0);
    private final SimulationRecordRepository repository;
    private final DensityBasedSignalAlgorithm densityBasedAlgorithm;

    public SimulationService(
            FixedTimeSignalAlgorithm fixedTimeAlgorithm,
            DensityBasedSignalAlgorithm densityBasedAlgorithm,
            SimulationRecordRepository repository
    ) {
        this.repository = repository;
        this.densityBasedAlgorithm = densityBasedAlgorithm;
        this.algorithms.put(fixedTimeAlgorithm.getName(), fixedTimeAlgorithm);
        this.algorithms.put(densityBasedAlgorithm.getName(), densityBasedAlgorithm);
    }

    public IntersectionConfig getConfig() {
        return config.get();
    }

    public IntersectionConfig updateConfig(IntersectionConfig newConfig) {
        if (newConfig != null) {
            config.set(newConfig);
        }
        return config.get();
    }

    public AlgorithmSignalResult getSignalStates(double elapsedSimulationSeconds) {
        TrafficSignalAlgorithm algorithm = algorithms.getOrDefault(config.get().activeAlgorithm(), algorithms.values().iterator().next());
        return algorithm.computeSignalStates(elapsedSimulationSeconds, config.get());
    }

    public Map<String, Object> handleControl(SimulationControlRequest request) {
        if (request == null || request.action() == null) {
            return Map.of("status", "ERROR", "message", "Invalid control request");
        }

        switch (request.action().toUpperCase()) {
            case "START" -> {
                isRunning.set(true);
                if (request.speedMultiplier() != null && request.speedMultiplier() > 0) {
                    currentSpeed.set(request.speedMultiplier());
                }
            }
            case "PAUSE" -> isRunning.set(false);
            case "RESET" -> {
                isRunning.set(false);
                repository.clear();
                densityBasedAlgorithm.reset();
            }
            case "SET_SPEED" -> {
                if (request.speedMultiplier() != null && request.speedMultiplier() > 0) {
                    currentSpeed.set(request.speedMultiplier());
                }
            }
            default -> {
                return Map.of("status", "ERROR", "message", "Unknown action: " + request.action());
            }
        }

        return Map.of(
            "status", "SUCCESS",
            "action", request.action().toUpperCase(),
            "isRunning", isRunning.get(),
            "speedMultiplier", currentSpeed.get()
        );
    }

    public void updateWaitingCounts(Map<Direction, Integer> waitingCounts) {
        if (waitingCounts != null) {
            densityBasedAlgorithm.updateWaitingCounts(waitingCounts);
        }
    }

    public DensityBasedSignalAlgorithm getDensityBasedAlgorithm() {
        return densityBasedAlgorithm;
    }

    public boolean isRunning() {
        return isRunning.get();
    }

    public double getCurrentSpeed() {
        return currentSpeed.get();
    }
}
