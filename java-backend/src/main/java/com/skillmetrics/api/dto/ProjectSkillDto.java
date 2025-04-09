package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSkillDto {

    private Long id;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    private String skillName; // For display purposes
    
    private String category; // For display purposes
    
    private String level; // For display purposes
    
    @NotBlank(message = "Required level is required")
    private String requiredLevel; // beginner, intermediate, expert
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
