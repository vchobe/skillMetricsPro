package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    
    /**
     * Alias for isActive for backward compatibility
     */
    public Boolean getActive() {
        return this.isActive;
    }
    
    /**
     * Alias for isActive for backward compatibility
     */
    public void setActive(Boolean active) {
        this.isActive = active;
    }
    
    private Boolean isCertificationRequired = false;
    
    private String certificationUrl;
    
    private String criteria;
    
    private Long createdBy;
    
    /**
     * Alias for createdBy for backward compatibility
     */
    public Long getCreatedById() {
        return this.createdBy;
    }
    
    /**
     * Alias for createdBy for backward compatibility
     */
    public void setCreatedById(Long createdById) {
        this.createdBy = createdById;
    }
    
    private String createdByName;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Statistics fields - not stored in database but used for API responses
    private Integer usageCount;
    private Double certificationRate;
}