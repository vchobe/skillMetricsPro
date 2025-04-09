package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_exports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillExport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String format; // e.g., "pdf", "csv", "json"
    
    private String fileUrl;
    
    private String fileName;
    
    @Column(nullable = false)
    private String status; // e.g., "pending", "processing", "completed", "failed"
    
    private String errorMessage;
    
    private Long fileSize;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime completedAt;
}
