package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String action; // added, removed, role_changed, allocation_changed
    
    @Column(name = "previous_role")
    private String previousRole;
    
    @Column(name = "new_role")
    private String newRole;
    
    @Column(name = "previous_allocation")
    private Integer previousAllocation;
    
    @Column(name = "new_allocation")
    private Integer newAllocation;
    
    @Column(nullable = false)
    private LocalDateTime date;
    
    @Column(name = "performed_by_id")
    private Long performedById;
    
    private String note;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (date == null) {
            date = LocalDateTime.now();
        }
    }
}
