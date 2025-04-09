package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillmetrics.api.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDto {
    
    private Long id;
    
    private Long userId;
    
    private NotificationType type;
    
    private String title;
    
    private String content;
    
    private boolean isRead;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    private Long relatedUserId;
    
    private Long relatedSkillId;
    
    private String link;
    
    // Fields for convenience when returning detailed information
    private UserDto user;
    private UserDto relatedUser;
    private SkillDto relatedSkill;
}