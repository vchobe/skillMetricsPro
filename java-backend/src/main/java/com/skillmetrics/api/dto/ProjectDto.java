package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(min = 1, max = 100, message = "Project name must be between 1 and 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    private Long clientId;
    
    private String clientName;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String location;
    
    private String confluenceLink;
    
    private Long leadId;
    
    private String leadName;
    
    private Long deliveryLeadId;
    
    private String deliveryLeadName;
    
    @NotBlank(message = "Status is required")
    private String status;
    
    @Email(message = "Invalid HR coordinator email format")
    private String hrCoordinatorEmail;
    
    @Email(message = "Invalid finance team email format")
    private String financeTeamEmail;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
