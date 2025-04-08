package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    
    List<Skill> findByUserId(Long userId);
    
    List<Skill> findByCategory(String category);
    
    List<Skill> findByLevel(String level);
    
    List<Skill> findByNameContainingIgnoreCase(String keyword);
    
    Optional<Skill> findByUserIdAndName(Long userId, String name);
    
    List<Skill> findByUserIdAndCategory(Long userId, String category);
}
