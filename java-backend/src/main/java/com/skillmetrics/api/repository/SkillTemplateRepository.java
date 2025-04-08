package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTemplateRepository extends JpaRepository<SkillTemplate, Long> {
    List<SkillTemplate> findByCategory(String category);
    List<SkillTemplate> findByRecommendedTrue();
    List<SkillTemplate> findByNameContainingIgnoreCase(String name);
}
