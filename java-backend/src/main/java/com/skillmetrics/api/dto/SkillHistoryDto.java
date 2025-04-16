package com.skillmetrics.api.dto;

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
public class SkillHistoryDto {

    private Long id;
    private Long skillId;
    private String skillName;
    private Long userId;
    private String username;
    private String action;
    private SkillLevel previousLevel;
    private SkillLevel newLevel;
    private String notes;
    private LocalDateTime timestamp;
    
    // Additional fields needed for controller compatibility
    private String field;
    private String oldValue;
    private String newValue;
    private Long changedBy;
    private String changeReason;
    private LocalDateTime createdAt;
    
    /**
     * Compatibility method for timestamp
     */
    public LocalDateTime getCreatedAt() {
        return this.createdAt != null ? this.createdAt : this.timestamp;
    }
    
    /**
     * Compatibility method for timestamp
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        if (this.timestamp == null) {
            this.timestamp = createdAt;
        }
    }
}
