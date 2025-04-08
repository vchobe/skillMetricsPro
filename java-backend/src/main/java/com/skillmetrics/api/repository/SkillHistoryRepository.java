package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SkillHistoryRepository extends JpaRepository<SkillHistory, Long> {
    
    List<SkillHistory> findBySkillId(Long skillId);
    
    @Query("SELECT sh FROM SkillHistory sh WHERE sh.skill.id = :skillId ORDER BY sh.timestamp DESC")
    List<SkillHistory> findBySkillIdOrderByTimestampDesc(Long skillId);
    
    @Query("SELECT sh FROM SkillHistory sh WHERE sh.skill.user.id = :userId ORDER BY sh.timestamp DESC")
    List<SkillHistory> findByUserIdOrderByTimestampDesc(Long userId);
    
    @Query("SELECT sh FROM SkillHistory sh WHERE sh.skill.user.id = :userId AND sh.action = :action ORDER BY sh.timestamp DESC")
    List<SkillHistory> findByUserIdAndActionOrderByTimestampDesc(Long userId, String action);
    
    List<SkillHistory> findByPerformedById(Long performedById);
    
    List<SkillHistory> findByTimestampAfter(LocalDateTime since);
    
    @Query("SELECT sh FROM SkillHistory sh WHERE sh.skill.id = :skillId AND sh.action = :action")
    List<SkillHistory> findBySkillIdAndAction(Long skillId, String action);
}
