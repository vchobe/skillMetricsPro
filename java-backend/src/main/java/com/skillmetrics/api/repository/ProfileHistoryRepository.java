package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProfileHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProfileHistoryRepository extends JpaRepository<ProfileHistory, Long> {
    
    List<ProfileHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<ProfileHistory> findByChangedFieldOrderByCreatedAtDesc(String changedField);
    
    List<ProfileHistory> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    List<ProfileHistory> findAllByOrderByCreatedAtDesc();
}