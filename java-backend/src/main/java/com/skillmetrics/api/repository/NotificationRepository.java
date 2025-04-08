package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.Notification;
import com.skillmetrics.api.model.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserId(Long userId);
    
    List<Notification> findByUserIdAndRead(Long userId, boolean read);
    
    List<Notification> findByUserIdAndType(Long userId, NotificationType type);
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(Long userId, boolean read);
    
    List<Notification> findByCreatedAtAfter(LocalDateTime since);
    
    List<Notification> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime since);
    
    int countByUserIdAndRead(Long userId, boolean read);
}
