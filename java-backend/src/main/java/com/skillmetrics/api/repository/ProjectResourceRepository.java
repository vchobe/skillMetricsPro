package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProjectResourceRepository extends JpaRepository<ProjectResource, Long> {
    
    List<ProjectResource> findByProjectId(Long projectId);
    
    List<ProjectResource> findByUserId(Long userId);
    
    List<ProjectResource> findByProjectIdAndUserId(Long projectId, Long userId);
    
    List<ProjectResource> findByRole(String role);
    
    List<ProjectResource> findByProjectIdAndRole(Long projectId, String role);
    
    List<ProjectResource> findByStartDateAfter(LocalDate date);
    
    List<ProjectResource> findByEndDateBefore(LocalDate date);
    
    List<ProjectResource> findByStartDateBeforeAndEndDateAfterOrEndDateIsNull(LocalDate startBefore, LocalDate endAfter);
    
    @Query("SELECT pr FROM ProjectResource pr WHERE pr.user.id = ?1 AND pr.allocation >= ?2")
    List<ProjectResource> findByUserIdAndMinimumAllocation(Long userId, Integer minimumAllocation);
    
    @Query("SELECT pr FROM ProjectResource pr JOIN pr.project p WHERE p.name LIKE %?1%")
    List<ProjectResource> findByProjectNameContaining(String keyword);
    
    @Query("SELECT pr FROM ProjectResource pr JOIN pr.user u WHERE u.firstName LIKE %?1% OR u.lastName LIKE %?1%")
    List<ProjectResource> findByUserNameContaining(String keyword);
}
