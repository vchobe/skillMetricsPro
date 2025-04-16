package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for PendingSkillUpdate entities
 * Includes additional fields for compatibility with the Node.js backend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime updatedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime approvedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime rejectedAt;
    
    // Additional fields for the DTO
    private String userName;
    private String userEmail;
    private String reviewerName;
    private String reviewerEmail;
    
    // Fields for compatibility with Node.js backend
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("category")
    private String category;
    
    @JsonProperty("level")
    private String level;
    
    @JsonProperty("certification")
    private String certification;
    
    @JsonProperty("credlyLink")
    private String credlyLink;
    
    @JsonProperty("notes")
    private String notes;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("is_update")
    private Boolean isUpdate;
    
    @JsonProperty("submitted_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime submittedAt;
    
    /**
     * Synchronize Node.js fields with Java backend fields
     * This method ensures that both field sets have the same data
     */
    public PendingSkillUpdateDto synchronizeFields() {
        // Map frontend fields to backend fields if needed
        if (name != null && (skillName == null || skillName.isEmpty())) {
            skillName = name;
        } else if (skillName != null && (name == null || name.isEmpty())) {
            name = skillName;
        }
        
        if (category != null && (skillCategory == null || skillCategory.isEmpty())) {
            skillCategory = category;
        } else if (skillCategory != null && (category == null || category.isEmpty())) {
            category = skillCategory;
        }
        
        if (level != null && (proposedLevel == null || proposedLevel.isEmpty())) {
            proposedLevel = level;
        } else if (proposedLevel != null && (level == null || level.isEmpty())) {
            level = proposedLevel;
        }
        
        if (notes != null && (justification == null || justification.isEmpty())) {
            justification = notes;
        } else if (justification != null && (notes == null || notes.isEmpty())) {
            notes = justification;
        }
        
        if (description != null && (justification == null || justification.isEmpty()) && (notes == null || notes.isEmpty())) {
            justification = description;
            notes = description;
        }
        
        if (submittedAt != null && createdAt == null) {
            createdAt = submittedAt;
        } else if (createdAt != null && submittedAt == null) {
            submittedAt = createdAt;
        }
        
        return this;
    }
}