package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    
    List<Skill> findByUserId(Long userId);
    
    List<Skill> findByNameContainingIgnoreCase(String keyword);
    
    List<Skill> findByCategory(String category);
    
    List<Skill> findByCategoryAndUserId(String category, Long userId);
    
    List<Skill> findByLevel(String level);
    
    List<Skill> findByVerified(boolean verified);
    
    @Query("SELECT s FROM Skill s WHERE s.user.id = ?1 AND s.name = ?2")
    List<Skill> findByUserIdAndName(Long userId, String name);
    
    @Query("SELECT s FROM Skill s ORDER BY s.endorsementCount DESC")
    List<Skill> findTopSkillsByEndorsements();
    
    @Query("SELECT DISTINCT s.category FROM Skill s")
    List<String> findAllCategories();
    
    @Query("SELECT DISTINCT s.level FROM Skill s")
    List<String> findAllLevels();
    
    @Query("SELECT s FROM Skill s JOIN s.user u WHERE u.firstName LIKE %?1% OR u.lastName LIKE %?1%")
    List<Skill> findByUserNameContaining(String keyword);
}
