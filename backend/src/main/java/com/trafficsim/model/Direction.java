package com.trafficsim.model;

public enum Direction {
    NORTH,
    SOUTH,
    EAST,
    WEST;

    public Direction getOpposite() {
        return switch (this) {
            case NORTH -> SOUTH;
            case SOUTH -> NORTH;
            case EAST -> WEST;
            case WEST -> EAST;
        };
    }
}
