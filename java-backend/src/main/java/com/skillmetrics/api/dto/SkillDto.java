package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillDto {

    private Long id;
    
    private Long userId;
    
    private String userName; // For display purposes
    
    @NotBlank(message = "Skill name is required")
    private String name;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Level is required")
    private String level;
    
    private String description;
    
    private String certification;
    
    private String credlyLink;
    
    private Long templateId;
    
    private List<EndorsementDto> endorsements;
    
    private int endorsementCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
