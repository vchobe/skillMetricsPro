package com.skillmetrics.api.model;

public enum SkillLevel {
    BEGINNER("beginner"),
    INTERMEDIATE("intermediate"),
    EXPERT("expert");

    private final String value;

    SkillLevel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static SkillLevel fromValue(String value) {
        for (SkillLevel level : SkillLevel.values()) {
            if (level.value.equalsIgnoreCase(value)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown skill level: " + value);
    }
}
