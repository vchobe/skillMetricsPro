package com.skillmetrics.api.dto;

import com.skillmetrics.api.model.enums.ProjectStatus;
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
public class ProjectDto {
    
    private Long id;
    
    @NotBlank(message = "Project name is required")
    private String name;
    
    private String description;
    
    private Long clientId;
    
    private String clientName; // For display purposes
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String location;
    
    private String confluenceLink;
    
    private Long leadId;
    
    private String leadName; // For display purposes
    
    private Long deliveryLeadId;
    
    private String deliveryLeadName; // For display purposes
    
    @NotNull(message = "Project status is required")
    private ProjectStatus status;
    
    private String hrCoordinatorEmail;
    
    private String financeTeamEmail;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
