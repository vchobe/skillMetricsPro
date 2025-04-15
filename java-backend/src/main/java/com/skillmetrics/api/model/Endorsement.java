package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "endorsements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Endorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endorser_id", nullable = false)
    private User endorser;
    
    private String comment;
    
    // Rating from 1-5 stars
    private Integer rating;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    /**
     * Convenience method to get skill ID
     * @return the skill ID or null if skill is null
     */
    public Long getSkillId() {
        return this.skill != null ? this.skill.getId() : null;
    }
    
    /**
     * Convenience method to set skill ID directly
     * @param skillId the skill ID to set
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
     * Convenience method to get endorser ID
     * @return the endorser ID or null if endorser is null
     */
    public Long getEndorserId() {
        return this.endorser != null ? this.endorser.getId() : null;
    }
    
    /**
     * Convenience method to set endorser ID directly
     * @param endorserId the endorser ID to set
     */
    public void setEndorserId(Long endorserId) {
        if (endorserId == null) {
            this.endorser = null;
            return;
        }
        
        if (this.endorser == null) {
            this.endorser = new User();
        }
        
        this.endorser.setId(endorserId);
    }
}
