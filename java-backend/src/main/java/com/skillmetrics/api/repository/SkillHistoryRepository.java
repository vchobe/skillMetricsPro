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
    
    List<SkillHistory> findByUserId(Long userId);
    
    @Query("""
           SELECT h FROM SkillHistory h
           WHERE h.skill.id = :skillId
           ORDER BY h.timestamp DESC
           """)
    List<SkillHistory> findSkillHistoryBySkillIdOrderByTimestampDesc(Long skillId);
    
    @Query("""
           SELECT h FROM SkillHistory h
           WHERE h.user.id = :userId
           ORDER BY h.timestamp DESC
           """)
    List<SkillHistory> findSkillHistoryByUserIdOrderByTimestampDesc(Long userId);
    
    @Query("""
           SELECT h FROM SkillHistory h
           WHERE h.timestamp BETWEEN :startDate AND :endDate
           ORDER BY h.timestamp DESC
           """)
    List<SkillHistory> findHistoryBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("""
           SELECT h FROM SkillHistory h
           WHERE h.user.id = :userId
           AND h.action = :action
           ORDER BY h.timestamp DESC
           """)
    List<SkillHistory> findByUserIdAndAction(Long userId, String action);
    
    /**
     * Find history entries for skills owned by a specific user
     */
    @Query("""
           SELECT h FROM SkillHistory h
           WHERE h.skill.user.id = :userId
           ORDER BY h.timestamp DESC
           """)
    List<SkillHistory> findBySkillUserId(Long userId);
}
