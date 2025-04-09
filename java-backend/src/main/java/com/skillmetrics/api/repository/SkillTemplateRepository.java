package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTemplateRepository extends JpaRepository<SkillTemplate, Long> {

    List<SkillTemplate> findByCategory(String category);
    
    List<SkillTemplate> findByIsActive(Boolean isActive);
    
    @Query("""
           SELECT t FROM SkillTemplate t
           WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(t.description) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(t.category) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<SkillTemplate> searchTemplates(String term);
    
    @Query("""
           SELECT DISTINCT t.category FROM SkillTemplate t
           ORDER BY t.category
           """)
    List<String> findAllCategories();
}
