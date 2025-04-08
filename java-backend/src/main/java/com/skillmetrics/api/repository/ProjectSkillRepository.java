package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {
    
    List<ProjectSkill> findByProjectId(Long projectId);
    
    List<ProjectSkill> findBySkillId(Long skillId);
    
    Optional<ProjectSkill> findByProjectIdAndSkillId(Long projectId, Long skillId);
    
    List<ProjectSkill> findByRequiredLevel(String requiredLevel);
}
