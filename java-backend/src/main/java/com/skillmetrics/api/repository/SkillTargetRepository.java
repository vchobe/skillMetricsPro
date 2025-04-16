package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SkillTargetRepository extends JpaRepository<SkillTarget, Long> {
    
    List<SkillTarget> findByUserId(Long userId);
    
    Optional<SkillTarget> findByUserIdAndSkillId(Long userId, Long skillId);
    
    List<SkillTarget> findByUserIdAndStatus(Long userId, String status);
    
    List<SkillTarget> findByStatus(String status);
    
    List<SkillTarget> findBySkillCategory(String category);
    
    @Query("SELECT st FROM SkillTarget st WHERE st.targetDate <= ?1 AND st.status = 'IN_PROGRESS'")
    List<SkillTarget> findExpiredTargets(LocalDate currentDate);
    
    @Query("SELECT st FROM SkillTarget st WHERE st.userId = ?1 AND st.targetDate <= ?2 AND st.status = 'IN_PROGRESS'")
    List<SkillTarget> findExpiredTargetsForUser(Long userId, LocalDate currentDate);
    
    @Query("SELECT st FROM SkillTarget st WHERE st.userId = ?1 AND st.targetDate BETWEEN ?2 AND ?3")
    List<SkillTarget> findTargetsInDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT COUNT(st) FROM SkillTarget st WHERE st.userId = ?1 AND st.status = ?2")
    long countByUserIdAndStatus(Long userId, String status);
}