package com.skillmetrics.api.dto;

import com.skillmetrics.api.model.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillHistoryDto {
    
    private Long id;
    
    private Long skillId;
    
    private String skillName; // For display purposes
    
    private Long userId;
    
    private String userName; // For display purposes
    
    private String action;
    
    private SkillLevel previousLevel;
    
    private SkillLevel newLevel;
    
    private String previousCategory;
    
    private String newCategory;
    
    private String notes;
    
    private Long performedById;
    
    private String performedByName; // For display purposes
    
    private LocalDateTime timestamp;
}
