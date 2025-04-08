package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByClientId(Long clientId);
    
    List<Project> findByLeadId(Long leadId);
    
    List<Project> findByDeliveryLeadId(Long deliveryLeadId);
    
    List<Project> findByStatus(String status);
    
    List<Project> findByLocation(String location);
    
    List<Project> findByStartDateAfter(LocalDate date);
    
    List<Project> findByEndDateBefore(LocalDate date);
    
    List<Project> findByNameContainingIgnoreCase(String keyword);
}
