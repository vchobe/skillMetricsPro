package com.skillmetrics.api.dto;

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
    private Long projectId;
    private Long skillId;
    private String requiredLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Derived fields from joins
    private String projectName;
    private String skillName;
    private String category;
    private String level;
}
