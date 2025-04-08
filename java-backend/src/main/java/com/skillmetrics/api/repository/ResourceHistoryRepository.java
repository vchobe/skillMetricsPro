package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ResourceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceHistoryRepository extends JpaRepository<ResourceHistory, Long> {
    
    List<ResourceHistory> findByProjectId(Long projectId);
    
    List<ResourceHistory> findByUserId(Long userId);
    
    List<ResourceHistory> findByProjectIdAndUserId(Long projectId, Long userId);
    
    List<ResourceHistory> findByAction(String action);
    
    List<ResourceHistory> findByPerformedById(Long performedById);
    
    List<ResourceHistory> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT rh FROM ResourceHistory rh WHERE rh.projectId = ?1 ORDER BY rh.date DESC")
    List<ResourceHistory> findByProjectIdOrderByDateDesc(Long projectId);
    
    @Query("SELECT rh FROM ResourceHistory rh WHERE rh.userId = ?1 ORDER BY rh.date DESC")
    List<ResourceHistory> findByUserIdOrderByDateDesc(Long userId);
}
