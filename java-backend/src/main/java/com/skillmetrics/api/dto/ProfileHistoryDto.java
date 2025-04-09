package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class ProfileHistoryDto {
    
    private Long id;
    
    private Long userId;
    
    private String changedField;
    
    private String previousValue;
    
    private String newValue;
    
    private LocalDateTime createdAt;
    
    // Additional fields for convenient display
    private String userName;
    private String userEmail;
}