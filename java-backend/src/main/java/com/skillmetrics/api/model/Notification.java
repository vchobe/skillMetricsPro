package com.skillmetrics.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(nullable = false)
    private String type;  // SKILL_ENDORSED, SKILL_UPDATED, PROJECT_ASSIGNED, etc.
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "entity_type")
    private String entityType;  // SKILL, PROJECT, USER, etc.
    
    @Column(name = "entity_id")
    private Long entityId;
    
    // For supporting older code that uses relatedId/relatedType
    private Long relatedId;
    private String relatedType;
    
    private String link;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    /**
     * For legacy code compatibility, allowing setRead in addition to setIsRead
     */
    public void setRead(Boolean read) {
        this.isRead = read;
    }
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    /**
     * Set the user who will receive this notification
     * @param user the user to set
     * @param <T> type parameter for supporting generic User types
     */
    public <T extends User> void setUser(T user) {
        if (user != null) {
            this.userId = user.getId();
        }
    }
}