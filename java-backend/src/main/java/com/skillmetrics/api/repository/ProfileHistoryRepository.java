package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProfileHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileHistoryRepository extends JpaRepository<ProfileHistory, Long> {
    List<ProfileHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ProfileHistory> findByUserIdAndChangedFieldOrderByCreatedAtDesc(Long userId, String changedField);
}
