package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectResourceRepository extends JpaRepository<ProjectResource, Long> {

    List<ProjectResource> findByProjectId(Long projectId);
    
    List<ProjectResource> findByUserId(Long userId);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.project.id = :projectId
           AND r.user.id = :userId
           """)
    Optional<ProjectResource> findByProjectIdAndUserId(Long projectId, Long userId);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.project.id = :projectId
           AND r.role = :role
           """)
    List<ProjectResource> findByProjectIdAndRole(Long projectId, String role);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.user.id = :userId
           AND ((r.startDate IS NULL OR r.startDate <= :date)
           AND (r.endDate IS NULL OR r.endDate >= :date))
           """)
    List<ProjectResource> findCurrentResourcesForUser(Long userId, LocalDate date);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.project.id = :projectId
           AND ((r.startDate IS NULL OR r.startDate <= :date)
           AND (r.endDate IS NULL OR r.endDate >= :date))
           """)
    List<ProjectResource> findCurrentResourcesForProject(Long projectId, LocalDate date);
    
    @Query("""
           SELECT SUM(r.allocation) FROM ProjectResource r
           WHERE r.user.id = :userId
           AND ((r.startDate IS NULL OR r.startDate <= :date)
           AND (r.endDate IS NULL OR r.endDate >= :date))
           """)
    Integer calculateUserTotalAllocation(Long userId, LocalDate date);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.user.id = :userId
           AND ((r.startDate IS NULL OR r.startDate <= CURRENT_DATE)
           AND (r.endDate IS NULL OR r.endDate >= CURRENT_DATE))
           ORDER BY r.project.id
           """)
    List<ProjectResource> findActiveResourcesByUserId(Long userId);
}
