package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @Column(nullable = false)
    private String requiredLevel; // beginner, intermediate, expert
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    /**
     * Convenience method to get skill name
     */
    public String getSkillName() {
        return this.skill != null ? this.skill.getName() : null;
    }
    
    /**
     * Convenience method to get skill category
     */
    public String getCategory() {
        return this.skill != null ? this.skill.getCategory() : null;
    }
    
    /**
     * Convenience method to get skill ID
     */
    public Long getSkillId() {
        return this.skill != null ? this.skill.getId() : null;
    }
    
    /**
     * Convenience method to get project ID
     */
    public Long getProjectId() {
        return this.project != null ? this.project.getId() : null;
    }
}
