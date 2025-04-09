package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.enums.SkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    
    List<Skill> findByUserId(Long userId);
    
    List<Skill> findByUserIdAndCategory(Long userId, String category);
    
    List<Skill> findByUserIdAndLevel(Long userId, SkillLevel level);
    
    List<Skill> findByNameContainingIgnoreCase(String name);
    
    List<Skill> findByCategoryContainingIgnoreCase(String category);
    
    @Query("SELECT DISTINCT s.category FROM Skill s")
    List<String> findAllCategories();
    
    @Query("SELECT s FROM Skill s WHERE s.user.id = :userId ORDER BY s.endorsementCount DESC")
    List<Skill> findTopSkillsByEndorsements(Long userId);
    
    @Query("SELECT s FROM Skill s WHERE s.name = :name AND s.user.id = :userId")
    List<Skill> findByNameAndUserId(String name, Long userId);
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.user.id = :userId")
    Integer countSkillsByUserId(Long userId);
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.user.id = :userId AND s.level = :level")
    Integer countSkillsByUserIdAndLevel(Long userId, SkillLevel level);
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.user.id = :userId AND s.category = :category")
    Integer countSkillsByUserIdAndCategory(Long userId, String category);
    
    @Query("SELECT s FROM Skill s WHERE s.verified = true")
    List<Skill> findAllVerifiedSkills();
    
    @Query("SELECT s FROM Skill s WHERE s.user.id = :userId AND s.verified = true")
    List<Skill> findVerifiedSkillsByUserId(Long userId);
    
    @Query("""
           SELECT s FROM Skill s
           WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.category) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.description) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<Skill> searchSkills(String term);
}
