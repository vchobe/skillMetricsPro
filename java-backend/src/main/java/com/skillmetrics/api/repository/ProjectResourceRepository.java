package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectResourceRepository extends JpaRepository<ProjectResource, Long> {
    
    List<ProjectResource> findByProjectId(Long projectId);
    
    List<ProjectResource> findByUserId(Long userId);
    
    List<ProjectResource> findByProjectIdAndUserId(Long projectId, Long userId);
}
