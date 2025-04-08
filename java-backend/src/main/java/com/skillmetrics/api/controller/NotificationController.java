package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.model.enums.NotificationType;
import com.skillmetrics.api.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<NotificationDto>> getAllNotificationsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getAllNotificationsForUser(userId));
    }
    
    @GetMapping("/user/{userId}/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<NotificationDto>> getUnreadNotificationsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(userId));
    }
    
    @GetMapping("/user/{userId}/type/{type}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<NotificationDto>> getNotificationsByType(
            @PathVariable Long userId, @PathVariable NotificationType type) {
        return ResponseEntity.ok(notificationService.getNotificationsByType(userId, type));
    }
    
    @GetMapping("/user/{userId}/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<NotificationDto>> getRecentNotifications(
            @PathVariable Long userId, @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(notificationService.getRecentNotifications(userId, days));
    }
    
    @GetMapping("/user/{userId}/unread/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Integer> getUnreadNotificationCount(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationCount(userId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<NotificationDto> createNotification(@Valid @RequestBody NotificationDto notificationDto) {
        return ResponseEntity.ok(notificationService.createNotification(notificationDto));
    }
    
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
    
    @PatchMapping("/user/{userId}/read-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<NotificationDto>> markAllAsRead(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.markAllAsRead(userId));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
    
    // Convenience endpoints for creating specific types of notifications
    
    @PostMapping("/endorsement")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<NotificationDto> createEndorsementNotification(
            @RequestParam Long userId, 
            @RequestParam String endorserName, 
            @RequestParam String skillName) {
        return ResponseEntity.ok(
            notificationService.createEndorsementNotification(userId, endorserName, skillName)
        );
    }
    
    @PostMapping("/skill-verified")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationDto> createSkillVerifiedNotification(
            @RequestParam Long userId, 
            @RequestParam String skillName) {
        return ResponseEntity.ok(
            notificationService.createSkillVerifiedNotification(userId, skillName)
        );
    }
    
    @PostMapping("/project-assigned")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<NotificationDto> createProjectAssignedNotification(
            @RequestParam Long userId, 
            @RequestParam String projectName, 
            @RequestParam String role) {
        return ResponseEntity.ok(
            notificationService.createProjectAssignedNotification(userId, projectName, role)
        );
    }
    
    @PostMapping("/welcome")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<NotificationDto> createWelcomeNotification(
            @RequestParam Long userId, 
            @RequestParam String userName) {
        return ResponseEntity.ok(
            notificationService.createWelcomeNotification(userId, userName)
        );
    }
}
