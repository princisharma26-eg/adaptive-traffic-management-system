package com.trafficsim.model;

public record IntersectionConfig(
    double northSouthGreenDuration,
    double eastWestGreenDuration,
    double yellowDuration,
    double allRedDuration,
    int spawnRatePerMinute,
    double speedMultiplier,
    String activeAlgorithm,
    Double minGreenDuration,
    Double maxGreenDuration
) {
    public IntersectionConfig {
        if (minGreenDuration == null || minGreenDuration <= 0) {
            minGreenDuration = 10.0;
        }
        if (maxGreenDuration == null || maxGreenDuration < minGreenDuration) {
            maxGreenDuration = 40.0;
        }
        if (activeAlgorithm == null || activeAlgorithm.isBlank()) {
            activeAlgorithm = "FIXED_TIME";
        }
    }

    public IntersectionConfig(
        double northSouthGreenDuration,
        double eastWestGreenDuration,
        double yellowDuration,
        double allRedDuration,
        int spawnRatePerMinute,
        double speedMultiplier,
        String activeAlgorithm
    ) {
        this(
            northSouthGreenDuration,
            eastWestGreenDuration,
            yellowDuration,
            allRedDuration,
            spawnRatePerMinute,
            speedMultiplier,
            activeAlgorithm,
            10.0,
            40.0
        );
    }

    public static IntersectionConfig defaultPhase1() {
        return new IntersectionConfig(
            30.0, // 30s North/South green
            30.0, // 30s East/West green
            3.0,  // 3s Yellow transition
            1.0,  // 1s all-red clearance interval
            20,   // default 20 vehicles/min arrival rate
            1.0,  // 1x speed
            "FIXED_TIME",
            10.0, // default min green
            40.0  // default max green
        );
    }

    public static IntersectionConfig defaultPhase2() {
        return new IntersectionConfig(
            30.0,
            30.0,
            3.0,
            1.0,
            20,
            1.0,
            "DENSITY_BASED",
            10.0,
            40.0
        );
    }

    public double getTotalCycleDuration() {
        return northSouthGreenDuration + yellowDuration + allRedDuration
             + eastWestGreenDuration + yellowDuration + allRedDuration;
    }
}
