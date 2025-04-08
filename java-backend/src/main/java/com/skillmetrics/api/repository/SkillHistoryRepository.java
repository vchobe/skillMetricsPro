package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillHistoryRepository extends JpaRepository<SkillHistory, Long> {
    List<SkillHistory> findBySkillId(Long skillId);
    List<SkillHistory> findByUserId(Long userId);
    List<SkillHistory> findBySkillIdOrderByCreatedAtDesc(Long skillId);
}
