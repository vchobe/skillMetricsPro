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
public class SkillDto {
    
    private Long id;
    
    @NotNull(message = "User ID is required")
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
    
    private boolean verified;
    
    private Integer endorsementCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
