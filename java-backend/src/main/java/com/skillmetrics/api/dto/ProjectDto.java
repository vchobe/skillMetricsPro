package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
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
    
    @NotBlank(message = "Project status is required")
    private String status;
    
    private String hrCoordinatorEmail;
    
    private String financeTeamEmail;
    
    private List<ProjectResourceDto> resources;
    
    private List<ProjectSkillDto> skills;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Used for resource counting in reports
    private Integer resourceCount;
    
    // Used for skill counting in reports
    private Integer skillCount;
}
