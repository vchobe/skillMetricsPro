package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SkillTargetRepository extends JpaRepository<SkillTarget, Long> {
    
    List<SkillTarget> findByUserId(Long userId);
    
    List<SkillTarget> findByUserIdAndStatus(Long userId, String status);
    
    List<SkillTarget> findByCreatedById(Long createdById);
    
    List<SkillTarget> findBySkillId(Long skillId);
    
    List<SkillTarget> findBySkillNameContainingIgnoreCase(String skillName);
    
    List<SkillTarget> findByCategoryContainingIgnoreCase(String category);
    
    @Query("SELECT st FROM SkillTarget st WHERE st.targetDate <= :date AND st.status = 'IN_PROGRESS'")
    List<SkillTarget> findUpcomingTargets(LocalDate date);
    
    @Query("SELECT st FROM SkillTarget st WHERE st.status = 'IN_PROGRESS' AND st.progress >= 80")
    List<SkillTarget> findNearCompletionTargets();
    
    @Query("SELECT DISTINCT st.category FROM SkillTarget st WHERE st.category IS NOT NULL")
    List<String> findAllCategories();
}