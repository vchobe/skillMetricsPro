package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByNameContainingIgnoreCase(String keyword);
    
    List<Project> findByClientId(Long clientId);
    
    List<Project> findByLeadId(Long leadId);
    
    List<Project> findByDeliveryLeadId(Long deliveryLeadId);
    
    List<Project> findByStatus(ProjectStatus status);
    
    List<Project> findByLocation(String location);
    
    List<Project> findByStartDateAfter(LocalDate date);
    
    List<Project> findByEndDateBefore(LocalDate date);
    
    List<Project> findByStartDateBeforeAndEndDateAfter(LocalDate startBefore, LocalDate endAfter);
    
    @Query("SELECT p FROM Project p JOIN p.client c WHERE c.name LIKE %?1%")
    List<Project> findByClientNameContaining(String clientName);
}
