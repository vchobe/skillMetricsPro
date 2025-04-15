package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String location;
    
    private String confluenceLink;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private User lead;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_lead_id")
    private User deliveryLead;
    
    @Column(nullable = false)
    private String status;
    
    private String hrCoordinatorEmail;
    
    private String financeTeamEmail;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectResource> resources;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectSkill> skills;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    /**
     * Convenience method to get client ID
     */
    public Long getClientId() {
        return this.client != null ? this.client.getId() : null;
    }
    
    /**
     * Convenience method to get lead ID
     */
    public Long getLeadId() {
        return this.lead != null ? this.lead.getId() : null;
    }
    
    /**
     * Convenience method to get delivery lead ID
     */
    public Long getDeliveryLeadId() {
        return this.deliveryLead != null ? this.deliveryLead.getId() : null;
    }
}
