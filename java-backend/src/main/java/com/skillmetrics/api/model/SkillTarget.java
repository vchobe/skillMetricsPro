package com.skillmetrics.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "skill_targets")
public class SkillTarget {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "skill_id")
    private Long skillId;
    
    @Column(name = "skill_name", nullable = false)
    private String skillName;
    
    @Column(name = "skill_category", nullable = false)
    private String skillCategory;
    
    @Column(name = "current_level")
    private String currentLevel;
    
    @Column(name = "target_level", nullable = false)
    private String targetLevel;
    
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;
    
    @Column(name = "status", nullable = false)
    private String status; // IN_PROGRESS, ACHIEVED, EXPIRED
    
    @Column(name = "progress_notes")
    private String progressNotes;
    
    @Column(name = "resources")
    private String resources;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}