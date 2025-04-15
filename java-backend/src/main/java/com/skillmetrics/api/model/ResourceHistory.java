package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;
    
    @Column(columnDefinition = "TEXT")
    private String note;
}