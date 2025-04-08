package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ResourceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceHistoryRepository extends JpaRepository<ResourceHistory, Long> {
    
    List<ResourceHistory> findByProjectIdOrderByDateDesc(Long projectId);
    
    List<ResourceHistory> findByUserIdOrderByDateDesc(Long userId);
    
    List<ResourceHistory> findByProjectIdAndUserIdOrderByDateDesc(Long projectId, Long userId);
    
    List<ResourceHistory> findByActionOrderByDateDesc(String action);
    
    List<ResourceHistory> findByDateBetweenOrderByDateDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    List<ResourceHistory> findByPerformedByIdOrderByDateDesc(Long performedById);
    
    List<ResourceHistory> findAllByOrderByDateDesc();
}
