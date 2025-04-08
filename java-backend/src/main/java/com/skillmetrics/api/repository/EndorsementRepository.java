package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {
    List<Endorsement> findBySkillId(Long skillId);
    
    List<Endorsement> findByEndorseeId(Long endorseeId);
    
    List<Endorsement> findByEndorserId(Long endorserId);
    
    @Query("SELECT COUNT(e) FROM Endorsement e WHERE e.skill.id = :skillId")
    Long countBySkillId(@Param("skillId") Long skillId);
    
    @Query("SELECT COUNT(e) FROM Endorsement e WHERE e.endorsee.id = :userId")
    Long countByEndorseeId(@Param("userId") Long userId);
    
    boolean existsBySkillIdAndEndorserId(Long skillId, Long endorserId);
}
