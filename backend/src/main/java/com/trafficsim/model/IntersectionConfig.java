package com.trafficsim.model;

public record IntersectionConfig(
    double northSouthGreenDuration,
    double eastWestGreenDuration,
    double yellowDuration,
    double allRedDuration,
    int spawnRatePerMinute,
    double speedMultiplier,
    String activeAlgorithm
) {
    public static IntersectionConfig defaultPhase1() {
        return new IntersectionConfig(
            30.0, // 30s North/South green
            30.0, // 30s East/West green
            3.0,  // 3s Yellow transition
            1.0,  // 1s all-red clearance interval
            20,   // default 20 vehicles/min arrival rate
            1.0,  // 1x speed
            "FIXED_TIME"
        );
    }

    public double getTotalCycleDuration() {
        return northSouthGreenDuration + yellowDuration + allRedDuration
             + eastWestGreenDuration + yellowDuration + allRedDuration;
    }
}
