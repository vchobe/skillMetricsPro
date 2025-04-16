package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillTemplateRepository extends JpaRepository<SkillTemplate, Long> {
    
    List<SkillTemplate> findByCategory(String category);
    
    List<SkillTemplate> findByIsActiveTrue();
    
    Optional<SkillTemplate> findByNameAndCategory(String name, String category);
    
    @Query("SELECT DISTINCT s.category FROM SkillTemplate s ORDER BY s.category")
    List<String> findAllCategories();
    
    @Query("SELECT t FROM SkillTemplate t WHERE t.isActive = true AND " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SkillTemplate> searchTemplates(String query);
    
    List<SkillTemplate> findByCreationSource(String source);
    
    List<SkillTemplate> findByIsCertificationRequiredTrue();
    
    /**
     * Find templates by active status
     */
    List<SkillTemplate> findByActiveTrue();
    
    /**
     * Find templates by exact name
     */
    Optional<SkillTemplate> findByName(String name);
    
    /**
     * Find templates created by a specific user
     */
    @Query("SELECT t FROM SkillTemplate t WHERE t.createdBy.id = :userId")
    List<SkillTemplate> findByCreatedById(Long userId);
}