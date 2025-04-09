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
}
