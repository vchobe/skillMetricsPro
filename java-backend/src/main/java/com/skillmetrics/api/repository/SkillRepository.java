package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    List<Skill> findByUserId(Long userId);
    
    List<Skill> findByUserIdAndCategory(Long userId, String category);
    
    List<Skill> findByUserIdAndLevel(Long userId, String level);
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.name = :name AND s.category = :category")
    Long countByNameAndCategory(String name, String category);
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.name = :name AND s.category = :category AND s.certification IS NOT NULL")
    Long countByNameAndCategoryAndCertificationIsNotNull(String name, String category);
    
    @Query("SELECT s FROM Skill s WHERE s.name = :name AND s.category = :category")
    List<Skill> findByNameAndCategory(String name, String category);
    
    @Query("SELECT s FROM Skill s WHERE s.user.id = :userId AND s.name = :name AND s.category = :category")
    List<Skill> findByUserIdAndNameAndCategory(Long userId, String name, String category);
    
    @Query("""
           SELECT s FROM Skill s 
           WHERE s.name = :name 
           AND s.category = :category 
           AND s.user.id = :userId
           """)
    List<Skill> findByNameAndCategoryAndUserId(String name, String category, Long userId);
    
    @Query("""
           SELECT DISTINCT s.category FROM Skill s
           ORDER BY s.category
           """)
    List<String> findAllCategories();
    
    @Query("""
           SELECT DISTINCT s.level FROM Skill s
           ORDER BY s.level
           """)
    List<String> findAllLevels();
    
    @Query("""
           SELECT s FROM Skill s
           WHERE s.user.id = :userId
           AND (LOWER(s.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.category) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.description) LIKE LOWER(CONCAT('%', :term, '%')))
           """)
    List<Skill> searchUserSkills(Long userId, String term);
    
    @Query("""
           SELECT s FROM Skill s
           WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :term, '%'))
           OR LOWER(s.category) LIKE LOWER(CONCAT('%', :term, '%'))
           """)
    List<Skill> searchSkills(String term);
    
    @Query("""
           SELECT COUNT(s) FROM Skill s
           WHERE s.category = :category
           """)
    Long countByCategory(String category);
    
    @Query("""
           SELECT COUNT(s) FROM Skill s
           WHERE s.level = :level
           """)
    Long countByLevel(String level);
    
    @Query("""
           SELECT s FROM Skill s
           JOIN FETCH s.user u
           ORDER BY SIZE(s.endorsements) DESC
           """)
    List<Skill> findTopEndorsedSkills();
}
