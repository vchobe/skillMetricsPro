package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    
    private Long id;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private Long createdBy;
    
    private String createdByName;
    
    @NotBlank(message = "Notification type is required")
    private String type;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String message;
    
    private String entityType;
    
    private Long entityId;
    
    private String link;
    
    private Boolean isRead = false;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    // Additional fields for better context in UI
    private String entityName;
    private String entityDescription;
}