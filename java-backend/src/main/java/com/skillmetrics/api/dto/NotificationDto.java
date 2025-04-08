package com.skillmetrics.api.dto;

import com.skillmetrics.api.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    
    private Long id;
    
    private Long userId;
    
    private String userName; // For display purposes
    
    private NotificationType type;
    
    private String title;
    
    private String message;
    
    private String link;
    
    private boolean read;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
}
