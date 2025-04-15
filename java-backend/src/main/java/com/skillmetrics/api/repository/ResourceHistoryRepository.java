package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ResourceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceHistoryRepository extends JpaRepository<ResourceHistory, Long> {

    List<ResourceHistory> findByUserIdOrderByDateDesc(Long userId);
    
    List<ResourceHistory> findByProjectIdOrderByDateDesc(Long projectId);
    
    List<ResourceHistory> findByUserIdAndProjectIdOrderByDateDesc(Long userId, Long projectId);
    
    List<ResourceHistory> findByProjectResourceIdOrderByDateDesc(Long projectResourceId);
    
    List<ResourceHistory> findByProjectIdAndUserId(Long projectId, Long userId);
    
    List<ResourceHistory> findByAction(String action);
    
    List<ResourceHistory> findByPerformedById(Long performedById);
    
    List<ResourceHistory> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}