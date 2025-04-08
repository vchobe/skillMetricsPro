package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    List<Client> findByNameContainingIgnoreCase(String keyword);
    
    List<Client> findByIndustryContainingIgnoreCase(String industry);
    
    List<Client> findByContactNameContainingIgnoreCase(String contactName);
    
    List<Client> findByContactEmailContainingIgnoreCase(String contactEmail);
    
    Client findByName(String name);
    
    boolean existsByName(String name);
}
