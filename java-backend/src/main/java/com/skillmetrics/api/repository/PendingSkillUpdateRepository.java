package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.PendingSkillUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PendingSkillUpdateRepository extends JpaRepository<PendingSkillUpdate, Long> {
    
    List<PendingSkillUpdate> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<PendingSkillUpdate> findBySkillIdOrderByCreatedAtDesc(Long skillId);
    
    List<PendingSkillUpdate> findByStatusOrderByCreatedAtDesc(String status);
    
    List<PendingSkillUpdate> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    
    List<PendingSkillUpdate> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);
    
    List<PendingSkillUpdate> findByApprovedByIdOrderByCreatedAtDesc(Long approvedById);
}