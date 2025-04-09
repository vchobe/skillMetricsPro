package com.skillmetrics.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pending_skill_updates")
public class PendingSkillUpdate {
    
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
    
    @Column(name = "proposed_level", nullable = false)
    private String proposedLevel;
    
    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;
    
    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED
    
    @Column(name = "reviewer_id")
    private Long reviewerId;
    
    @Column(name = "reviewer_comments", columnDefinition = "TEXT")
    private String reviewerComments;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}