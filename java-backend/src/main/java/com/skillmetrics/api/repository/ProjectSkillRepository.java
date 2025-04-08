package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {
    
    List<ProjectSkill> findByProjectId(Long projectId);
    
    List<ProjectSkill> findBySkillId(Long skillId);
    
    @Query("SELECT ps FROM ProjectSkill ps " +
           "LEFT JOIN Skill s ON ps.skillId = s.id " +
           "WHERE ps.projectId = :projectId")
    List<ProjectSkill> findByProjectIdWithSkillDetails(@Param("projectId") Long projectId);
    
    void deleteByProjectIdAndSkillId(Long projectId, Long skillId);
}
