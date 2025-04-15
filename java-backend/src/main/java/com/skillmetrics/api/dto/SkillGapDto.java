package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for skill gap information.
 * Represents the gap between required and available skills.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillGapDto {
    
    private Long id;
    private String skillName;
    private String category;
    private String requiredLevel;
    private String availableLevel;
    private Integer gapLevel; // Numerical representation of the gap (e.g., 2 levels below required)
    private Integer availableCount; // Number of employees with this skill
    private Integer requiredCount; // Number of positions requiring this skill
    private Integer shortageCount; // requiredCount - availableCount (if > 0)
    private String priority; // "High", "Medium", "Low"
    private Long projectId;
    private String projectName;
    private String status; // "Critical", "Moderate", "Minor"
    private String recommendedAction; // e.g., "Training", "Hiring", "External Consulting"
    private LocalDateTime identifiedAt;
    private LocalDateTime targetResolutionDate;
    
    // Flag indicating if this is an actual gap (true) or just a potential future requirement (false)
    private Boolean isActive;
    
    // Optional fields for additional context
    private String notes;
    private String trainingRecommendations;
    private Double estimatedResolutionCost;
    private String resolutionOwner;
}