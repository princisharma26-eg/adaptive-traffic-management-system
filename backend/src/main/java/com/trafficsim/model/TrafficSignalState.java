package com.trafficsim.model;

public record TrafficSignalState(
    Direction direction,
    SignalColor color,
    double remainingSeconds
) {}
