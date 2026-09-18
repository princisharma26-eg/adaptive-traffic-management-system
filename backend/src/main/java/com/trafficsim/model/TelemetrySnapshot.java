package com.trafficsim.model;

import java.util.Map;

public record TelemetrySnapshot(
    double simulationTimeSeconds,
    int totalSpawned,
    int totalPassed,
    int currentWaiting,
    Map<Direction, Integer> waitingByDirection,
    Map<Direction, Integer> passedByDirection,
    double maxWaitTimeSeconds,
    double averageWaitTimeSeconds
) {}
