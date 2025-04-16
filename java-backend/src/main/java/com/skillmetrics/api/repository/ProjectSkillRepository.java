package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {

    List<ProjectSkill> findByProjectId(Long projectId);
    
    List<ProjectSkill> findBySkillId(Long skillId);
    
    Optional<ProjectSkill> findByProjectIdAndSkillId(Long projectId, Long skillId);
    
    boolean existsByProjectIdAndSkillId(Long projectId, Long skillId);
    
    @Query("""
           SELECT ps FROM ProjectSkill ps
           JOIN FETCH ps.skill s
           WHERE ps.project.id = :projectId
           ORDER BY s.name
           """)
    List<ProjectSkill> findByProjectIdWithSkillDetails(Long projectId);
    
    @Query("""
           SELECT DISTINCT ps.requiredLevel FROM ProjectSkill ps
           """)
    List<String> findAllRequiredLevels();
    
    @Query("""
           SELECT COUNT(ps) FROM ProjectSkill ps
           WHERE ps.skill.category = :category
           """)
    Long countBySkillCategory(String category);
    
    @Query("""
           SELECT COUNT(ps) FROM ProjectSkill ps
           WHERE ps.requiredLevel = :level
           """)
    Long countByRequiredLevel(String level);
    
    // Additional required methods
    List<ProjectSkill> findByRequiredLevel(String requiredLevel);
    
    @Query("""
           SELECT ps FROM ProjectSkill ps
           JOIN FETCH ps.project p 
           JOIN FETCH ps.skill s
           WHERE s.category = :category
           """)
    List<ProjectSkill> findBySkillCategory(@Param("category") String category);
    
    @Query("""
           SELECT ps FROM ProjectSkill ps
           JOIN FETCH ps.project p 
           JOIN FETCH ps.skill s
           WHERE p.name LIKE %:keyword%
           """)
    List<ProjectSkill> findByProjectNameContaining(@Param("keyword") String keyword);
    
    @Query("""
           SELECT ps FROM ProjectSkill ps
           JOIN FETCH ps.project p 
           JOIN FETCH ps.skill s
           WHERE s.name LIKE %:keyword%
           """)
    List<ProjectSkill> findBySkillNameContaining(@Param("keyword") String keyword);
}
