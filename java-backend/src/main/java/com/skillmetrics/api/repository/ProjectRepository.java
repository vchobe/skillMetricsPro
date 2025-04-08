package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByClientId(Long clientId);
    
    List<Project> findByStatus(String status);
    
    List<Project> findByLeadId(Long leadId);
    
    List<Project> findByDeliveryLeadId(Long deliveryLeadId);
}
