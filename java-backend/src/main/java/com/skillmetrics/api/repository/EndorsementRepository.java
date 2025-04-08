package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {
    
    @Query("SELECT e FROM Endorsement e ORDER BY e.createdAt DESC")
    List<Endorsement> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT e FROM Endorsement e WHERE e.skill.id = :skillId ORDER BY e.createdAt DESC")
    List<Endorsement> findBySkillIdOrderByCreatedAtDesc(Long skillId);
    
    List<Endorsement> findByEndorserId(Long endorserId);
    
    @Query("SELECT e FROM Endorsement e WHERE e.skill.user.id = :ownerId")
    List<Endorsement> findBySkillOwnerId(Long ownerId);
    
    Optional<Endorsement> findBySkillIdAndEndorserId(Long skillId, Long endorserId);
    
    @Query("SELECT AVG(e.rating) FROM Endorsement e WHERE e.skill.id = :skillId")
    Double getAverageRatingForSkill(Long skillId);
    
    @Query("SELECT COUNT(e) FROM Endorsement e WHERE e.skill.id = :skillId")
    Integer getEndorsementCountForSkill(Long skillId);
    
    List<Endorsement> findByRatingGreaterThanEqual(Integer minimumRating);
}
