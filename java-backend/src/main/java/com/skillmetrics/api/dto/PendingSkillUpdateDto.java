package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingSkillUpdateDto {
    
    private Long id;
    
    private Long userId;
    
    private Long skillId;
    
    @NotBlank(message = "Skill name is required")
    private String skillName;
    
    @NotBlank(message = "Skill category is required")
    private String skillCategory;
    
    private String currentLevel;
    
    @NotBlank(message = "Proposed level is required")
    private String proposedLevel;
    
    private String justification;
    
    private String status;
    
    private Long reviewerId;
    
    private String reviewerComments;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime approvedAt;
    
    private LocalDateTime rejectedAt;
    
    // Additional fields for the DTO
    private String userName;
    private String userEmail;
    private String reviewerName;
    private String reviewerEmail;
}