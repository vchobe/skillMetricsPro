package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.PendingSkillUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PendingSkillUpdateRepository extends JpaRepository<PendingSkillUpdate, Long> {
    
    List<PendingSkillUpdate> findByUserId(Long userId);
    
    List<PendingSkillUpdate> findByStatus(String status);
    
    List<PendingSkillUpdate> findByUserIdAndStatus(Long userId, String status);
    
    Optional<PendingSkillUpdate> findByUserIdAndSkillIdAndStatus(Long userId, Long skillId, String status);
    
    List<PendingSkillUpdate> findByReviewerId(Long reviewerId);
    
    List<PendingSkillUpdate> findByReviewerIdAndStatus(Long reviewerId, String status);
    
    @Query("SELECT COUNT(p) FROM PendingSkillUpdate p WHERE p.status = 'PENDING'")
    long countPendingUpdates();
    
    @Query("SELECT COUNT(p) FROM PendingSkillUpdate p WHERE p.status = 'PENDING' AND p.userId = ?1")
    long countPendingUpdatesForUser(Long userId);
}