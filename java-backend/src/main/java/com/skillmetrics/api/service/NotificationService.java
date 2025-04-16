package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    /**
     * Create a notification
     */
    @Transactional
    public NotificationDto createNotification(NotificationDto notificationDto) {
        Notification notification = new Notification();
        notification.setUserId(notificationDto.getUserId());
        notification.setCreatedBy(notificationDto.getCreatedBy());
        notification.setType(notificationDto.getType());
        notification.setTitle(notificationDto.getTitle());
        notification.setMessage(notificationDto.getMessage());
        notification.setEntityType(notificationDto.getEntityType());
        notification.setEntityId(notificationDto.getEntityId());
        notification.setLink(notificationDto.getLink());
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDto(savedNotification);
    }
    
    /**
     * Create a simple notification with minimal fields
     */
    @Transactional
    public NotificationDto createNotification(Long userId, String title, String message, String link) {
        NotificationDto notificationDto = new NotificationDto();
        notificationDto.setUserId(userId);
        notificationDto.setType("SYSTEM");
        notificationDto.setTitle(title);
        notificationDto.setMessage(message);
        notificationDto.setLink(link);
        
        return createNotification(notificationDto);
    }

    /**
     * Get notifications for a user with pagination
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotificationsForUser(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToDto);
    }

    /**
     * Get all notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getAllNotificationsForUser(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotificationsForUser(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * Count unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId, LocalDateTime.now());
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    /**
     * Get notification statistics for a user
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getNotificationStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Unread count
        long unreadCount = notificationRepository.countUnreadByUserId(userId);
        stats.put("unreadCount", unreadCount);
        
        // Total count
        long totalCount = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).size();
        stats.put("totalCount", totalCount);
        
        // Count by type
        List<Object[]> countsByType = notificationRepository.countByType(userId);
        Map<String, Long> typeDistribution = new HashMap<>();
        
        for (Object[] result : countsByType) {
            String type = (String) result[0];
            Long count = (Long) result[1];
            typeDistribution.put(type, count);
        }
        
        stats.put("byType", typeDistribution);
        
        return stats;
    }

    /**
     * Create system notifications for specific events
     */
    @Transactional
    public void createSkillEndorsementNotification(Long skillId, Long endorserId) {
        Skill skill = skillRepository.findById(skillId).orElse(null);
        User endorser = userRepository.findById(endorserId).orElse(null);
        
        if (skill != null && endorser != null) {
            NotificationDto notification = new NotificationDto();
            notification.setUserId(skill.getUserId());
            notification.setCreatedBy(endorserId);
            notification.setType("SKILL_ENDORSED");
            notification.setTitle("Skill Endorsed");
            notification.setMessage(endorser.getFirstName() + " " + endorser.getLastName() + 
                    " endorsed your skill: " + skill.getName());
            notification.setEntityType("SKILL");
            notification.setEntityId(skillId);
            notification.setLink("/skills/" + skillId);
            
            createNotification(notification);
        }
    }

    @Transactional
    public void createProjectAssignmentNotification(Long projectId, Long userId, String role) {
        Project project = projectRepository.findById(projectId).orElse(null);
        
        if (project != null) {
            NotificationDto notification = new NotificationDto();
            notification.setUserId(userId);
            notification.setCreatedBy(null); // System generated
            notification.setType("PROJECT_ASSIGNED");
            notification.setTitle("Project Assignment");
            notification.setMessage("You have been assigned to project '" + project.getName() + 
                    "' as " + role);
            notification.setEntityType("PROJECT");
            notification.setEntityId(projectId);
            notification.setLink("/projects/" + projectId);
            
            createNotification(notification);
        }
    }

    @Transactional
    public void createSkillApprovalNotification(Long skillId, Long approverId) {
        Skill skill = skillRepository.findById(skillId).orElse(null);
        User approver = userRepository.findById(approverId).orElse(null);
        
        if (skill != null && approver != null) {
            NotificationDto notification = new NotificationDto();
            notification.setUserId(skill.getUserId());
            notification.setCreatedBy(approverId);
            notification.setType("SKILL_APPROVED");
            notification.setTitle("Skill Approved");
            notification.setMessage(approver.getFirstName() + " " + approver.getLastName() + 
                    " approved your skill: " + skill.getName());
            notification.setEntityType("SKILL");
            notification.setEntityId(skillId);
            notification.setLink("/skills/" + skillId);
            
            createNotification(notification);
        }
    }

    // Helper method to convert entity to DTO
    public NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUserId());
        dto.setCreatedBy(notification.getCreatedBy());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setEntityType(notification.getEntityType());
        dto.setEntityId(notification.getEntityId());
        dto.setLink(notification.getLink());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        
        // Add creator name if available
        if (notification.getCreatedBy() != null) {
            userRepository.findById(notification.getCreatedBy()).ifPresent(user -> {
                dto.setCreatedByName(user.getFirstName() + " " + user.getLastName());
            });
        }
        
        // Add entity context based on type
        if (notification.getEntityType() != null && notification.getEntityId() != null) {
            switch (notification.getEntityType()) {
                case "SKILL":
                    skillRepository.findById(notification.getEntityId()).ifPresent(skill -> {
                        dto.setEntityName(skill.getName());
                        dto.setEntityDescription(skill.getCategory() + " - " + skill.getLevel());
                    });
                    break;
                case "PROJECT":
                    projectRepository.findById(notification.getEntityId()).ifPresent(project -> {
                        dto.setEntityName(project.getName());
                        dto.setEntityDescription(project.getDescription());
                    });
                    break;
                case "USER":
                    userRepository.findById(notification.getEntityId()).ifPresent(user -> {
                        dto.setEntityName(user.getFirstName() + " " + user.getLastName());
                        dto.setEntityDescription(user.getEmail());
                    });
                    break;
                case "CLIENT":
                    clientRepository.findById(notification.getEntityId()).ifPresent(client -> {
                        dto.setEntityName(client.getName());
                        dto.setEntityDescription(client.getIndustry());
                    });
                    break;
            }
        }
        
        return dto;
    }
}