package com.skillmetrics.api.websocket;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    
    /**
     * Subscribes a user to notifications via WebSocket
     */
    @MessageMapping("/notifications.subscribe")
    public void subscribeToNotifications(@Payload Map<String, Object> payload, @CurrentUser UserPrincipal currentUser) {
        log.info("User {} subscribed to notifications", currentUser.getUsername());
        
        // Send initial data on connection
        sendInitialData(currentUser.getId());
    }
    
    /**
     * When a user subscribes, send them their unread notifications and counts
     */
    private void sendInitialData(Long userId) {
        // Get unread notifications
        List<NotificationDto> unreadNotifications = notificationService.getUnreadNotificationsForUser(userId);
        
        // Get unread count
        long unreadCount = notificationService.countUnreadNotifications(userId);
        
        // Create response
        Map<String, Object> response = new HashMap<>();
        response.put("unreadNotifications", unreadNotifications);
        response.put("unreadCount", unreadCount);
        
        // Send to the subscribed user
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                response
        );
    }
    
    /**
     * Broadcast a notification to specific users via WebSocket
     * Called by the notification service when a new notification is created
     */
    public void broadcastNotification(NotificationDto notification) {
        if (notification == null || notification.getUserId() == null) {
            return;
        }
        
        // Find the user to send to
        User user = userRepository.findById(notification.getUserId()).orElse(null);
        if (user == null) {
            return;
        }
        
        // Send to the user's personal queue
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/notifications",
                notification
        );
        
        // Update unread count
        long unreadCount = notificationService.countUnreadNotifications(user.getId());
        Map<String, Object> countUpdate = Map.of("unreadCount", unreadCount);
        
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/notifications.count",
                countUpdate
        );
    }
    
    /**
     * Broadcast to all users - for system-wide announcements
     * Only admins can call this
     */
    @MessageMapping("/notifications.broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public void broadcastToAll(@Payload NotificationDto notification, @CurrentUser UserPrincipal currentUser) {
        // Create system notification for each active user
        userRepository.findAll().forEach(user -> {
            NotificationDto userNotification = new NotificationDto();
            userNotification.setUserId(user.getId());
            userNotification.setCreatedBy(currentUser.getId());
            userNotification.setType("SYSTEM_ANNOUNCEMENT");
            userNotification.setTitle(notification.getTitle());
            userNotification.setMessage(notification.getMessage());
            userNotification.setEntityType(notification.getEntityType());
            userNotification.setEntityId(notification.getEntityId());
            userNotification.setLink(notification.getLink());
            
            // Save notification
            NotificationDto savedNotification = notificationService.createNotification(userNotification);
            
            // Broadcast to user
            broadcastNotification(savedNotification);
        });
    }
}