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
    @JoinColumn(name = "project_resource_id")
    private ProjectResource projectResource;
    
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
    
    /**
     * Convenience method to get project ID
     */
    public Long getProjectId() {
        return this.project != null ? this.project.getId() : null;
    }
    
    /**
     * Convenience method to get user ID
     */
    public Long getUserId() {
        return this.user != null ? this.user.getId() : null;
    }
    
    /**
     * Convenience method to get performed by user ID
     */
    public Long getPerformedById() {
        return this.performedBy != null ? this.performedBy.getId() : null;
    }
    
    /**
     * Convenience method to set project resource
     */
    public void setProjectResource(ProjectResource projectResource) {
        this.projectResource = projectResource;
        if (projectResource != null) {
            this.project = projectResource.getProject();
            this.user = projectResource.getUser();
        }
    }
    
    /**
     * Alias for getDate() to provide compatibility with standard naming conventions
     */
    public LocalDateTime getCreatedAt() {
        return this.date;
    }
    
    /**
     * Alias for setDate() to provide compatibility with standard naming conventions
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.date = createdAt;
    }
    
    /**
     * Convenience method to set project ID directly
     * @param projectId the project ID
     */
    public void setProjectId(Long projectId) {
        if (projectId == null) {
            this.project = null;
            return;
        }
        
        if (this.project == null) {
            this.project = new Project();
        }
        
        this.project.setId(projectId);
    }
    
    /**
     * Convenience method to set user ID directly
     * @param userId the user ID
     */
    public void setUserId(Long userId) {
        if (userId == null) {
            this.user = null;
            return;
        }
        
        if (this.user == null) {
            this.user = new User();
        }
        
        this.user.setId(userId);
    }
    
    /**
     * Convenience method to set performed by user ID directly
     * @param performedById the user ID who performed the action
     */
    public void setPerformedById(Long performedById) {
        if (performedById == null) {
            this.performedBy = null;
            return;
        }
        
        if (this.performedBy == null) {
            this.performedBy = new User();
        }
        
        this.performedBy.setId(performedById);
    }
}