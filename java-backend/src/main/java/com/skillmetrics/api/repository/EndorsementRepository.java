package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {

    List<Endorsement> findBySkillId(Long skillId);
    
    List<Endorsement> findByEndorserId(Long endorserId);
    
    @Query("""
           SELECT e FROM Endorsement e
           WHERE e.skill.id = :skillId
           AND e.endorser.id = :endorserId
           """)
    Optional<Endorsement> findBySkillIdAndEndorserId(Long skillId, Long endorserId);
    
    @Query("""
           SELECT COUNT(e) FROM Endorsement e
           WHERE e.skill.user.id = :userId
           """)
    Long countAllEndorsementsForUserSkills(Long userId);
    
    @Query("""
           SELECT COUNT(e) FROM Endorsement e
           WHERE e.endorser.id = :userId
           """)
    Long countAllEndorsementsByUser(Long userId);
    
    // Find all endorsements ordered by creation date
    List<Endorsement> findAllOrderByCreatedAtDesc();
    
    // Find endorsements for a specific skill ordered by creation date
    List<Endorsement> findBySkillIdOrderByCreatedAtDesc(Long skillId);
    
    // Find endorsements for a specific user ordered by creation date
    List<Endorsement> findByEndorserIdOrderByCreatedAtDesc(Long endorserId);
    
    // Find endorsements for a skill owned by a specific user
    @Query("""
           SELECT e FROM Endorsement e
           WHERE e.skill.user.id = :userId
           ORDER BY e.createdAt DESC
           """)
    List<Endorsement> findBySkillUserIdOrderByCreatedAtDesc(Long userId);
    
    // Find all endorsements for skills owned by a specific user
    @Query("""
           SELECT e FROM Endorsement e
           WHERE e.skill.user.id = :userId
           """)
    List<Endorsement> findBySkillOwnerId(Long userId);
    
    // Get average rating for a specific skill
    @Query("""
           SELECT AVG(e.rating) FROM Endorsement e
           WHERE e.skill.id = :skillId
           """)
    Double getAverageRatingForSkill(Long skillId);
    
    // Get endorsement count for a specific skill
    @Query("""
           SELECT COUNT(e) FROM Endorsement e
           WHERE e.skill.id = :skillId
           """)
    Integer getEndorsementCountForSkill(Long skillId);
    
    // Find endorsements with rating greater than or equal to a specific value
    List<Endorsement> findByRatingGreaterThanEqual(Integer rating);
}
