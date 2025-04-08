package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long skillId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String action; // added, updated, deleted
    
    private String previousLevel;
    
    private String newLevel;
    
    private String previousCategory;
    
    private String newCategory;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    private Long performedById;
    
    private String note;
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
