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
            @RequestParam(name = "elapsedSeconds", defaultValue = "0.0") double elapsedSeconds) {
        return ResponseEntity.ok(simulationService.getSignalStates(elapsedSeconds));
    }

    @PostMapping("/control")
    public ResponseEntity<Map<String, Object>> handleControl(@Valid @RequestBody SimulationControlRequest request) {
        return ResponseEntity.ok(simulationService.handleControl(request));
    }

    @PostMapping("/telemetry")
    public ResponseEntity<SimulationMetrics> receiveTelemetry(@RequestBody TelemetrySnapshot snapshot) {
        SimulationMetrics calculatedMetrics = analyticsService.recordTelemetry(snapshot);
        return ResponseEntity.ok(calculatedMetrics);
    }
}
