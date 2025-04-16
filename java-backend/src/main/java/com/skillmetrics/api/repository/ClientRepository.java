package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByIndustry(String industry);
    
    @Query("""
           SELECT c FROM Client c 
           WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(c.industry) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(c.contactName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(c.description) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<Client> searchClients(String term);
    
    @Query("""
           SELECT DISTINCT c.industry 
           FROM Client c 
           WHERE c.industry IS NOT NULL 
           ORDER BY c.industry
           """)
    List<String> findAllIndustries();
}
