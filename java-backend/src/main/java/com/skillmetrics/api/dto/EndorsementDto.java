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
    
    @NotNull(message = "Endorser ID is required")
    private Long endorserId;
    
    private String endorserName; // For display purposes
    
    private String endorserTitle; // For display purposes
    
    private String comment;
    
    private LocalDateTime createdAt;
}
