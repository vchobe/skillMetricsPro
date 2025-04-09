package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillmetrics.api.model.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SkillTargetDto {
    
    private Long id;
    
    private Long userId;
    
    private String skillName;
    
    private String category;
    
    private SkillLevel currentLevel;
    
    private SkillLevel targetLevel;
    
    private LocalDate targetDate;
    
    private String description;
    
    private String resources;
    
    private String status;
    
    private Long createdById;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime completedAt;
    
    private Long skillId;
    
    private Integer progress;
    
    // Additional fields for convenient display
    private String userName;
    private String userEmail;
    private String createdByName;
}