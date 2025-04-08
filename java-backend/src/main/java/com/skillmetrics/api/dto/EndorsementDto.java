package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EndorsementDto {
    
    private Long id;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    private String skillName; // For display purposes
    
    private Long skillOwnerId; // The user who owns the skill
    
    private String skillOwnerName; // For display purposes
    
    @NotNull(message = "Endorser ID is required")
    private Long endorserId;
    
    private String endorserName; // For display purposes
    
    private String comment;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must not exceed 5")
    private Integer rating;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
