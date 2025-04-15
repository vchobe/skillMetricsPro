package com.skillmetrics.api.dto;

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
public class EndorsementDto {

    private Long id;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    private String skillName; // For display purposes
    
    private Long skillOwnerId; // ID of the user who owns the skill
    
    private String skillOwnerName; // Name of the user who owns the skill
    
    @NotNull(message = "Endorser ID is required")
    private Long endorserId;
    
    private String endorserName; // For display purposes
    
    private String endorserTitle; // For display purposes
    
    private String comment;
    
    // Rating from 1-5 stars
    private Integer rating;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
