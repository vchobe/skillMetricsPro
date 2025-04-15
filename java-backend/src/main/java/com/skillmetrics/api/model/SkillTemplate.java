package com.skillmetrics.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "skill_templates")
@NoArgsConstructor
@AllArgsConstructor
public class SkillTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    private String description;

    @Column(name = "default_level")
    private String defaultLevel;

    @Column(name = "creation_source")
    private String creationSource;  // SYSTEM, HR, MANAGER

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_certification_required")
    private Boolean isCertificationRequired = false;

    @Column(name = "certification_url")
    private String certificationUrl;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}