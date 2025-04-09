package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.SkillExport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SkillExportRepository extends JpaRepository<SkillExport, Long> {

    List<SkillExport> findByUserId(Long userId);
    
    List<SkillExport> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    
    List<SkillExport> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<SkillExport> findByStatusOrderByCreatedAtAsc(String status);
    
    List<SkillExport> findByCreatedAtBeforeAndStatus(LocalDateTime date, String status);
}
