package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {
    
    List<Endorsement> findBySkillId(Long skillId);
    
    List<Endorsement> findByEndorserId(Long endorserId);
    
    List<Endorsement> findBySkillIdAndEndorserId(Long skillId, Long endorserId);
    
    List<Endorsement> findByRating(Integer rating);
    
    List<Endorsement> findByRatingGreaterThanEqual(Integer rating);
}
