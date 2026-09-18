package com.trafficsim.model;

import java.util.Map;

public record SimulationMetrics(
    double throughputPerMinute,
    double averageWaitTimeSeconds,
    double maxWaitTimeSeconds,
    int currentQueueLength,
    int totalSpawned,
    int totalPassed,
    double simulationTimeSeconds,
    Map<Direction, Integer> waitingByDirection,
    Map<Direction, Integer> passedByDirection,
    double fairnessIndex // Jain's fairness index (0.0 - 1.0) across the 4 approaches
) {}
