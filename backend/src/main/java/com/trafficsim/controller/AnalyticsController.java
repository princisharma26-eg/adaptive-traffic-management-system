package com.trafficsim.controller;

import com.trafficsim.model.SimulationMetrics;
import com.trafficsim.model.TelemetrySnapshot;
import com.trafficsim.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/live")
    public ResponseEntity<SimulationMetrics> getLiveMetrics() {
        return ResponseEntity.ok(analyticsService.getLiveMetrics());
    }

    @GetMapping("/history")
    public ResponseEntity<List<TelemetrySnapshot>> getHistory(
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(analyticsService.getRecentHistory(limit));
    }
}
