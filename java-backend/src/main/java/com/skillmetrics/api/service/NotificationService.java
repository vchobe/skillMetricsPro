package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Notification;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.model.enums.NotificationType;
import com.skillmetrics.api.repository.NotificationRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Transactional(readOnly = true)
    public List<NotificationDto> getAllNotificationsForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotificationsForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsByType(Long userId, NotificationType type) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return notificationRepository.findByUserIdAndType(userId, type).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<NotificationDto> getRecentNotifications(Long userId, int days) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return notificationRepository.findByUserIdAndCreatedAtAfter(userId, since).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public int getUnreadNotificationCount(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return notificationRepository.countByUserIdAndRead(userId, false);
    }
    
    @Transactional
    public NotificationDto createNotification(NotificationDto notificationDto) {
        User user = userRepository.findById(notificationDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", notificationDto.getUserId()));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(notificationDto.getType());
        notification.setTitle(notificationDto.getTitle());
        notification.setMessage(notificationDto.getMessage());
        notification.setLink(notificationDto.getLink());
        notification.setRead(false); // Always create as unread
        
        Notification savedNotification = notificationRepository.save(notification);
        
        return mapToDto(savedNotification);
    }
    
    @Transactional
    public NotificationDto markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        
        // Check if the current user is the owner of the notification
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Cannot identify current user"));
        
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Users can only mark their own notifications as read");
        }
        
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        
        Notification updatedNotification = notificationRepository.save(notification);
        
        return mapToDto(updatedNotification);
    }
    
    @Transactional
    public List<NotificationDto> markAllAsRead(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        // Check if the current user is the same as userId
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Cannot identify current user"));
        
        if (!userId.equals(currentUser.getId())) {
            throw new IllegalStateException("Users can only mark their own notifications as read");
        }
        
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndRead(userId, false);
        LocalDateTime now = LocalDateTime.now();
        
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });
        
        List<Notification> updatedNotifications = notificationRepository.saveAll(unreadNotifications);
        
        return updatedNotifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        
        // Check if the current user is the owner of the notification or an admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Cannot identify current user"));
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && !notification.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Users can only delete their own notifications");
        }
        
        notificationRepository.delete(notification);
    }
    
    // Convenience method to create notifications for specific types of events
    @Transactional
    public NotificationDto createEndorsementNotification(Long userId, String endorserName, String skillName) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setUserId(userId);
        notificationDto.setType(NotificationType.ENDORSEMENT);
        notificationDto.setTitle("New Skill Endorsement");
        notificationDto.setMessage(endorserName + " has endorsed your " + skillName + " skill.");
        notificationDto.setLink("/skills/" + skillName);
        
        return createNotification(notificationDto);
    }
    
    @Transactional
    public NotificationDto createSkillVerifiedNotification(Long userId, String skillName) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setUserId(userId);
        notificationDto.setType(NotificationType.SKILL_VERIFIED);
        notificationDto.setTitle("Skill Verification");
        notificationDto.setMessage("Your " + skillName + " skill has been verified.");
        notificationDto.setLink("/skills/" + skillName);
        
        return createNotification(notificationDto);
    }
    
    @Transactional
    public NotificationDto createProjectAssignedNotification(Long userId, String projectName, String role) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setUserId(userId);
        notificationDto.setType(NotificationType.PROJECT_ASSIGNED);
        notificationDto.setTitle("New Project Assignment");
        notificationDto.setMessage("You have been assigned to project " + projectName + " as " + role + ".");
        notificationDto.setLink("/projects/" + projectName);
        
        return createNotification(notificationDto);
    }
    
    @Transactional
    public NotificationDto createWelcomeNotification(Long userId, String userName) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setUserId(userId);
        notificationDto.setType(NotificationType.WELCOME);
        notificationDto.setTitle("Welcome to SkillMetrics");
        notificationDto.setMessage("Welcome, " + userName + "! Start by adding your skills and exploring available projects.");
        notificationDto.setLink("/dashboard");
        
        return createNotification(notificationDto);
    }
    
    // Helper method to map Notification entity to NotificationDto
    private NotificationDto mapToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUser().getId());
        
        String userName = notification.getUser().getFirstName() + " " + notification.getUser().getLastName();
        dto.setUserName(userName.trim());
        
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setLink(notification.getLink());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        
        return dto;
    }
}
