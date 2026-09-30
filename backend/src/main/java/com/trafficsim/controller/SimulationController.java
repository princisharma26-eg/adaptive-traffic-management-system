package com.trafficsim.controller;

import com.trafficsim.algorithm.TrafficSignalAlgorithm.AlgorithmSignalResult;
import com.trafficsim.model.IntersectionConfig;
import com.trafficsim.model.SimulationControlRequest;
import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import com.trafficsim.service.AnalyticsService;
import com.trafficsim.service.SimulationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "*")
public class SimulationController {

    private final SimulationService simulationService;
    private final AnalyticsService analyticsService;

    public SimulationController(SimulationService simulationService, AnalyticsService analyticsService) {
        this.simulationService = simulationService;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/config")
    public ResponseEntity<IntersectionConfig> getConfig() {
        return ResponseEntity.ok(simulationService.getConfig());
    }

    @PostMapping("/config")
    public ResponseEntity<IntersectionConfig> updateConfig(@RequestBody IntersectionConfig newConfig) {
        return ResponseEntity.ok(simulationService.updateConfig(newConfig));
    }

    @GetMapping("/signals")
    public ResponseEntity<AlgorithmSignalResult> getSignalStates(
            @RequestParam(name = "elapsedSeconds", defaultValue = "0.0") double elapsedSeconds,
            @RequestParam(name = "northWaiting", required = false) Integer northWaiting,
            @RequestParam(name = "southWaiting", required = false) Integer southWaiting,
            @RequestParam(name = "eastWaiting", required = false) Integer eastWaiting,
            @RequestParam(name = "westWaiting", required = false) Integer westWaiting) {
        if (northWaiting != null || southWaiting != null || eastWaiting != null || westWaiting != null) {
            java.util.Map<com.trafficsim.model.Direction, Integer> map = new java.util.EnumMap<>(com.trafficsim.model.Direction.class);
            if (northWaiting != null) map.put(com.trafficsim.model.Direction.NORTH, northWaiting);
            if (southWaiting != null) map.put(com.trafficsim.model.Direction.SOUTH, southWaiting);
            if (eastWaiting != null) map.put(com.trafficsim.model.Direction.EAST, eastWaiting);
            if (westWaiting != null) map.put(com.trafficsim.model.Direction.WEST, westWaiting);
            simulationService.updateWaitingCounts(map);
        }
        return ResponseEntity.ok(simulationService.getSignalStates(elapsedSeconds));
    }

    @PostMapping("/control")
    public ResponseEntity<Map<String, Object>> handleControl(@Valid @RequestBody SimulationControlRequest request) {
        return ResponseEntity.ok(simulationService.handleControl(request));
    }

    @PostMapping("/telemetry")
    public ResponseEntity<SimulationMetrics> receiveTelemetry(@RequestBody TelemetrySnapshot snapshot) {
        if (snapshot != null && snapshot.waitingByDirection() != null) {
            simulationService.updateWaitingCounts(snapshot.waitingByDirection());
        }
        SimulationMetrics calculatedMetrics = analyticsService.recordTelemetry(snapshot);
        return ResponseEntity.ok(calculatedMetrics);
    }
}
