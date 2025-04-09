package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportDto {

    private Long id;
    
    private Long userId;
    
    private String userName; // For display purposes
    
    @NotBlank(message = "Export format is required")
    private String format;
    
    private String fileUrl;
    
    private String fileName;
    
    private String status;
    
    private String errorMessage;
    
    private Long fileSize;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime completedAt;
}
