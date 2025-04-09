package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDto {

    private Long id;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    private String projectName; // For display purposes
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String userName; // For display purposes
    
    private String userEmail; // For display purposes
    
    @NotNull(message = "Role is required")
    private String role;
    
    @Min(value = 1, message = "Allocation must be at least 1%")
    @Max(value = 100, message = "Allocation cannot exceed 100%")
    private Integer allocation;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
