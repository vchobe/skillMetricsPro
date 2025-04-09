package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ResourceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceHistoryRepository extends JpaRepository<ResourceHistory, Long> {

    List<ResourceHistory> findByProjectIdOrderByDateDesc(Long projectId);
    
    List<ResourceHistory> findByUserIdOrderByDateDesc(Long userId);
    
    List<ResourceHistory> findByProjectResourceIdOrderByDateDesc(Long resourceId);
    
    @Query("""
           SELECT h FROM ResourceHistory h
           WHERE h.project.id = :projectId
           AND h.action = :action
           ORDER BY h.date DESC
           """)
    List<ResourceHistory> findByProjectIdAndAction(Long projectId, String action);
    
    @Query("""
           SELECT h FROM ResourceHistory h
           WHERE h.user.id = :userId
           AND h.action = :action
           ORDER BY h.date DESC
           """)
    List<ResourceHistory> findByUserIdAndAction(Long userId, String action);
    
    @Query("""
           SELECT h FROM ResourceHistory h
           WHERE h.date BETWEEN :startDate AND :endDate
           ORDER BY h.date DESC
           """)
    List<ResourceHistory> findHistoryBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
}
