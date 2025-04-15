package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillTargetDto {
    
    private Long id;
    
    private Long userId;
    
    private Long skillId;
    
    @NotBlank(message = "Skill name is required")
    private String skillName;
    
    @NotBlank(message = "Skill category is required")
    private String skillCategory;
    
    private String currentLevel;
    
    @NotBlank(message = "Target level is required")
    private String targetLevel;
    
    @NotNull(message = "Target date is required")
    @Future(message = "Target date must be in the future")
    private LocalDate targetDate;
    
    private String status;
    
    private String progressNotes;
    
    private String resources;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Additional fields for the DTO
    private String userName;
    private String skillDescription;
}