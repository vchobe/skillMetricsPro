package com.skillmetrics.api.model;

import com.skillmetrics.api.model.enums.SkillLevel;
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "current_name")
    private String currentName;
    
    @Column(name = "new_name")
    private String newName;
    
    @Column(name = "current_category")
    private String currentCategory;
    
    @Column(name = "new_category")
    private String newCategory;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "current_level")
    private SkillLevel currentLevel;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "new_level")
    private SkillLevel newLevel;
    
    @Column(name = "current_description", columnDefinition = "TEXT")
    private String currentDescription;
    
    @Column(name = "new_description", columnDefinition = "TEXT")
    private String newDescription;
    
    @Column(name = "current_certification")
    private String currentCertification;
    
    @Column(name = "new_certification")
    private String newCertification;
    
    @Column(name = "current_credly_link")
    private String currentCredlyLink;
    
    @Column(name = "new_credly_link")
    private String newCredlyLink;
    
    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;
    
    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id")
    private User requestedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}