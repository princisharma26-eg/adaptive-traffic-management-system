package com.trafficsim.model;

import jakarta.validation.constraints.NotNull;

public record SimulationControlRequest(
    @NotNull String action, // START, PAUSE, RESET, SET_SPEED
    Double speedMultiplier
) {}
