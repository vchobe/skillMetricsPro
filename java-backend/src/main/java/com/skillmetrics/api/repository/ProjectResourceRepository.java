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
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.user.id = :userId
           AND ((r.startDate IS NULL OR r.startDate <= :date)
           AND (r.endDate IS NULL OR r.endDate >= :date))
           ORDER BY r.project.id
           """)
    List<ProjectResource> findActiveResourcesByUserIdAtDate(Long userId, LocalDate date);
    
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.project.id = :projectId
           AND r.user.id = :userId
           AND r.role = :role
           """)
    Optional<ProjectResource> findByProjectIdAndUserIdAndRole(Long projectId, Long userId, String role);
    
    @Query("""
           SELECT SUM(r.allocation) FROM ProjectResource r
           WHERE r.user.id = :userId
           AND ((r.startDate IS NULL OR r.startDate <= :date)
           AND (r.endDate IS NULL OR r.endDate >= :date))
           """)
    Integer getTotalAllocationForUserAtDate(Long userId, LocalDate date);
    
    /**
     * Find project resources by role
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.role = :role
           """)
    List<ProjectResource> findByRole(String role);
    
    /**
     * Find project resources with start date after specified date
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.startDate > :startDate
           """)
    List<ProjectResource> findByStartDateAfter(LocalDate startDate);
    
    /**
     * Find project resources with end date before specified date
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.endDate < :endDate
           """)
    List<ProjectResource> findByEndDateBefore(LocalDate endDate);
    
    /**
     * Find active project resources on a specified date
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE (r.startDate <= :date)
           AND (r.endDate >= :date OR r.endDate IS NULL)
           """)
    List<ProjectResource> findByStartDateBeforeAndEndDateAfterOrEndDateIsNull(LocalDate date, LocalDate sameDate);
    
    /**
     * Find resources with minimum allocation
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE r.user.id = :userId
           AND r.allocation >= :minAllocation
           """)
    List<ProjectResource> findByUserIdAndMinimumAllocation(Long userId, Integer minAllocation);
    
    /**
     * Find resources by project name containing text
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE LOWER(r.project.name) LIKE LOWER(CONCAT('%', :projectName, '%'))
           """)
    List<ProjectResource> findByProjectNameContaining(String projectName);
    
    /**
     * Find resources by user name containing text
     */
    @Query("""
           SELECT r FROM ProjectResource r
           WHERE LOWER(r.user.firstName) LIKE LOWER(CONCAT('%', :userName, '%'))
           OR LOWER(r.user.lastName) LIKE LOWER(CONCAT('%', :userName, '%'))
           OR LOWER(CONCAT(r.user.firstName, ' ', r.user.lastName)) LIKE LOWER(CONCAT('%', :userName, '%'))
           """)
    List<ProjectResource> findByUserNameContaining(String userName);
}
