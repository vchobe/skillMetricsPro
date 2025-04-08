package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResourceDto {
    
    private Long id;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    private String projectName;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String userName;
    
    @NotBlank(message = "Role is required")
    private String role;
    
    @Min(value = 0, message = "Allocation percentage must be at least 0")
    @Max(value = 100, message = "Allocation percentage must be at most 100")
    private Integer allocation;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
