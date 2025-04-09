package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
    
    @Query("""
           SELECT p FROM Project p
           WHERE p.startDate <= :date AND (p.endDate IS NULL OR p.endDate >= :date)
           """)
    List<Project> findActiveProjectsAtDate(LocalDate date);
    
    @Query("""
           SELECT p FROM Project p 
           WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(p.description) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(p.location) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(p.status) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<Project> searchProjects(String term);
}
