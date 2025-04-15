package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String action; // created, updated, level_changed, etc.
    
    private String previousValue;
    
    private String newValue;
    
    // For specific field changes
    private String field;
    
    private String oldValue;
    
    private Long changedBy;
    
    private String changeReason;
    
    // For level changes specifically
    private String previousLevel;
    
    private String newLevel;
    
    // Additional notes about the history entry
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;
    
    @CreationTimestamp
    private LocalDateTime timestamp;
    
    /**
     * For compatibility with code that uses createdAt instead of timestamp
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.timestamp = createdAt;
    }
    
    /**
     * For compatibility with code that uses createdAt instead of timestamp
     */
    public LocalDateTime getCreatedAt() {
        return this.timestamp;
    }
    
    /**
     * Convenience method to set skill ID directly
     * @param skillId the skill ID
     */
    public void setSkillId(Long skillId) {
        if (skillId == null) {
            this.skill = null;
            return;
        }
        
        if (this.skill == null) {
            this.skill = new Skill();
        }
        
        this.skill.setId(skillId);
    }
    
    /**
     * Convenience method to set user ID directly
     * @param userId the user ID
     */
    public void setUserId(Long userId) {
        if (userId == null) {
            this.user = null;
            return;
        }
        
        if (this.user == null) {
            this.user = new User();
        }
        
        this.user.setId(userId);
    }
}
