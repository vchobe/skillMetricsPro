package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for summarized skill information.
 * Provides an aggregated view of skills across users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillSummaryDto {
    
    private String name;
    private String category;
    private Integer totalUsers;
    private List<String> levels; // List of levels people have in this skill
    private Integer beginnerCount;
    private Integer intermediateCount;
    private Integer advancedCount;
    private Integer expertCount;
    private Integer certifiedCount; // Number of users with certifications for this skill
    private List<String> certifications; // List of unique certification names for this skill
    private Double averageEndorsements; // Average number of endorsements per user
    private Integer totalEndorsements; // Total endorsements across all users
    private LocalDateTime earliestAddedDate; // Date when this skill first appeared
    private LocalDateTime latestAddedDate; // Date when this skill was most recently added
    private List<String> relatedSkills; // Other skills commonly found together with this one
    private Integer projectDemandCount; // Number of projects requiring this skill
    private String growthTrend; // "Increasing", "Stable", "Decreasing"
    
    // Optional additional statistics
    private Double averageYearsExperience;
    private Double endorsementToUserRatio;
    private List<String> topEndorsers; // Username/name of top endorsers
}