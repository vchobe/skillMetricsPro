package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSkillDto {
    
    private Long id;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    private String projectName;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    private String skillName;
    
    private String category;
    
    @NotBlank(message = "Required level is required")
    private String requiredLevel;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
