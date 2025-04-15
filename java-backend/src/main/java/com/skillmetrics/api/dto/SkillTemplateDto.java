package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillTemplateDto {
    
    private Long id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    private String description;
    
    private String defaultLevel;
    
    private String creationSource;
    
    private Boolean isActive = true;
    
    private Boolean isCertificationRequired = false;
    
    private String certificationUrl;
    
    private Long createdBy;
    
    private String createdByName;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Statistics fields - not stored in database but used for API responses
    private Integer usageCount;
    private Double certificationRate;
}