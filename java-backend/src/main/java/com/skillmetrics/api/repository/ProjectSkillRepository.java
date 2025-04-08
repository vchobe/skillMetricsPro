package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {
    
    List<ProjectSkill> findByProjectId(Long projectId);
    
    List<ProjectSkill> findBySkillId(Long skillId);
    
    List<ProjectSkill> findByProjectIdAndSkillId(Long projectId, Long skillId);
    
    List<ProjectSkill> findByRequiredLevel(String requiredLevel);
    
    @Query("SELECT ps FROM ProjectSkill ps JOIN ps.skill s WHERE s.category = ?1")
    List<ProjectSkill> findBySkillCategory(String category);
    
    @Query("SELECT ps FROM ProjectSkill ps JOIN ps.project p WHERE p.name LIKE %?1%")
    List<ProjectSkill> findByProjectNameContaining(String keyword);
    
    @Query("SELECT ps FROM ProjectSkill ps JOIN ps.skill s WHERE s.name LIKE %?1%")
    List<ProjectSkill> findBySkillNameContaining(String keyword);
    
    @Query("SELECT COUNT(ps) > 0 FROM ProjectSkill ps WHERE ps.project.id = ?1 AND ps.skill.id = ?2")
    boolean existsByProjectIdAndSkillId(Long projectId, Long skillId);
}
