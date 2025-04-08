package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    List<User> findByUsernameContainingIgnoreCase(String keyword);
    
    List<User> findByRole(String role);
    
    List<User> findByLocation(String location);
}
