package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Notification;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.model.enums.NotificationType;
import com.skillmetrics.api.repository.NotificationRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    public List<NotificationDto> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<NotificationDto> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public NotificationDto createNotification(NotificationDto notificationDto) {
        Notification notification = convertToEntity(notificationDto);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(false);
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDto(savedNotification);
    }
    
    @Transactional
    public NotificationDto createSystemNotification(Long userId, String title, String content, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(NotificationType.SYSTEM);
        notification.setLink(link);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDto(savedNotification);
    }
    
    @Transactional
    public NotificationDto createNotification(Long userId, String content, String link, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        NotificationType notificationType;
        try {
            notificationType = NotificationType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException ex) {
            notificationType = NotificationType.SYSTEM;
        }
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setContent(content);
        notification.setType(notificationType);
        notification.setLink(link);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDto(savedNotification);
    }
    
    @Transactional
    public NotificationDto markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        
        Notification updatedNotification = notificationRepository.save(notification);
        return convertToDto(updatedNotification);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
        
        unreadNotifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        });
        
        notificationRepository.saveAll(unreadNotifications);
    }
    
    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        
        notificationRepository.deleteById(id);
    }
    
    // Helper methods for entity <-> DTO conversion
    
    private NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        BeanUtils.copyProperties(notification, dto);
        
        dto.setUserId(notification.getUser().getId());
        
        if (notification.getRelatedUser() != null) {
            dto.setRelatedUserId(notification.getRelatedUser().getId());
        }
        
        return dto;
    }
    
    private Notification convertToEntity(NotificationDto dto) {
        Notification entity = new Notification();
        BeanUtils.copyProperties(dto, entity, "userId", "relatedUserId");
        
        // Set user
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        entity.setUser(user);
        
        // Set related user if provided
        if (dto.getRelatedUserId() != null) {
            User relatedUser = userRepository.findById(dto.getRelatedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Related user not found with id: " + dto.getRelatedUserId()));
            entity.setRelatedUser(relatedUser);
        }
        
        return entity;
    }
}