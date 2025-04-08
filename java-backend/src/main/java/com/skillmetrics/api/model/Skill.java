package com.skillmetrics.api.model;

import com.skillmetrics.api.model.enums.SkillLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SkillLevel level;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private int yearsOfExperience;
    
    private String certification;
    
    private String certificationAuthority;
    
    private LocalDateTime certificationDate;
    
    private LocalDateTime expirationDate;
    
    private String credlyLink;
    
    private boolean verified;
    
    private Long verifiedBy;
    
    private LocalDateTime verifiedAt;
    
    private Integer endorsementCount;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
