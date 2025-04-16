package com.skillmetrics.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "skills")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private String level;
    
    private String description;
    
    private String certification;
    
    private String credlyLink;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private SkillTemplate template;
    
    // Number of endorsements for this skill
    private Integer endorsementCount;
    
    // Flag indicating if the skill has been verified by admin
    private Boolean verified;
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Endorsement> endorsements = new ArrayList<>();
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillHistory> history = new ArrayList<>();
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectSkill> projectSkills = new ArrayList<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    /**
     * Convenience method to set user by ID
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
     * Convenience method to get user ID
     * @return the user ID
     */
    public Long getUserId() {
        return this.user != null ? this.user.getId() : null;
    }
}
