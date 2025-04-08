package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ResourceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceHistoryRepository extends JpaRepository<ResourceHistory, Long> {
    
    List<ResourceHistory> findByProjectId(Long projectId);
    
    List<ResourceHistory> findByUserId(Long userId);
    
    List<ResourceHistory> findByProjectIdAndUserId(Long projectId, Long userId);
}
