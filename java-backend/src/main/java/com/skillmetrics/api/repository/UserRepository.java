package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    List<User> findByRole(String role);
    
    @Query("""
           SELECT u FROM User u 
           WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.department) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.jobTitle) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(u.location) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<User> searchUsers(String term);
    
    @Query("""
           SELECT COUNT(u) FROM User u
           WHERE u.role = :role
           """)
    Long countByRole(String role);
    
    @Query("""
           SELECT COUNT(u) FROM User u
           WHERE u.location = :location
           """)
    Long countByLocation(String location);
    
    @Query("""
           SELECT COUNT(u) FROM User u
           WHERE u.department = :department
           """)
    Long countByDepartment(String department);
    
    /**
     * Find all users by their IDs
     */
    List<User> findAllByIdIn(List<Long> userIds);
    
    /**
     * Find users by department or location
     */
    @Query("""
           SELECT u FROM User u
           WHERE u.department = :departmentOrLocation
           OR u.location = :departmentOrLocation
           """)
    List<User> findByDepartmentOrLocation(String departmentOrLocation);
}
