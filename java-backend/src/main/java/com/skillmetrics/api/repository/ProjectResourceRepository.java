package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectResourceRepository extends JpaRepository<ProjectResource, Long> {
    
    List<ProjectResource> findByProjectId(Long projectId);
    
    List<ProjectResource> findByUserId(Long userId);
    
    Optional<ProjectResource> findByProjectIdAndUserId(Long projectId, Long userId);
    
    List<ProjectResource> findByRole(String role);
    
    List<ProjectResource> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<ProjectResource> findByEndDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<ProjectResource> findByAllocationGreaterThanEqual(Integer allocation);
}
