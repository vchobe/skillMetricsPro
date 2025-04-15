package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.NotificationDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Notification;
import com.skillmetrics.api.repository.NotificationRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    /**
     * Get all notifications for the current user with pagination
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationDto> notifications = notificationService.getNotificationsForUser(currentUser.getId(), pageable);
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for the current user
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDto>> getMyUnreadNotifications(
            @CurrentUser UserPrincipal currentUser) {
        
        List<NotificationDto> notifications = notificationService.getUnreadNotificationsForUser(currentUser.getId());
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread count for the current user
     */
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @CurrentUser UserPrincipal currentUser) {
        
        long count = notificationService.countUnreadNotifications(currentUser.getId());
        
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Get notifications for a specific user (admin only)
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<Page<NotificationDto>> getUserNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationDto> notifications = notificationService.getNotificationsForUser(userId, pageable);
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get a specific notification
     */
    @GetMapping("/{id}")
    @PreAuthorize("@securityService.isNotificationOwner(#id, authentication.principal.id) or hasRole('ADMIN')")
    public ResponseEntity<NotificationDto> getNotification(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        
        return ResponseEntity.ok(notificationService.convertToDto(notification));
    }

    /**
     * Create a new notification (admin/system only)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM')")
    public ResponseEntity<NotificationDto> createNotification(
            @Valid @RequestBody NotificationDto notificationDto) {
        
        NotificationDto createdNotification = notificationService.createNotification(notificationDto);
        
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdNotification.getId())
                .toUri();
        
        return ResponseEntity.created(location).body(createdNotification);
    }

    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("@securityService.isNotificationOwner(#id, authentication.principal.id) or hasRole('ADMIN')")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        // Verify notification exists
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification not found with id: " + id);
        }
        
        notificationService.markAsRead(id);
        
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read for the current user
     */
    @PutMapping("/mark-all-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAllAsRead(@CurrentUser UserPrincipal currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        
        return ResponseEntity.ok().build();
    }

    /**
     * Get notification statistics for the current user
     */
    @GetMapping("/statistics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getNotificationStatistics(
            @CurrentUser UserPrincipal currentUser) {
        
        Map<String, Object> stats = notificationService.getNotificationStats(currentUser.getId());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Delete a notification (admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        // Verify notification exists
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification not found with id: " + id);
        }
        
        notificationRepository.deleteById(id);
        
        return ResponseEntity.ok().build();
    }
}