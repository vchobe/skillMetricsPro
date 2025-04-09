package com.skillmetrics.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profile_history")
public class ProfileHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "changed_field", nullable = false)
    private String changedField;
    
    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;
    
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}