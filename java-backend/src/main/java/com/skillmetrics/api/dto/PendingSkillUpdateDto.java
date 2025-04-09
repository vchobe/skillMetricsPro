package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillmetrics.api.model.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PendingSkillUpdateDto {
    
    private Long id;
    
    private Long skillId;
    
    private Long userId;
    
    private String currentName;
    
    private String newName;
    
    private String currentCategory;
    
    private String newCategory;
    
    private SkillLevel currentLevel;
    
    private SkillLevel newLevel;
    
    private String currentDescription;
    
    private String newDescription;
    
    private String currentCertification;
    
    private String newCertification;
    
    private String currentCredlyLink;
    
    private String newCredlyLink;
    
    private String justification;
    
    private String status;
    
    private Long requestedById;
    
    private Long approvedById;
    
    private String rejectionReason;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime processedAt;
    
    // Additional fields for convenient display
    private String skillName;
    private String userName;
    private String requestedByName;
    private String approvedByName;
}