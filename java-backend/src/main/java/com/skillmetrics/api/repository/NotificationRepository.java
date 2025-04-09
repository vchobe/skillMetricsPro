package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Notification;
import com.skillmetrics.api.model.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead);
    
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);
    
    List<Notification> findByRelatedUserId(Long relatedUserId);
    
    List<Notification> findByRelatedSkillId(Long relatedSkillId);
    
    long countByUserIdAndIsRead(Long userId, boolean isRead);
}