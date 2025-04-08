package com.skillmetrics.api.dto;

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
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private Long clientId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private String confluenceLink;
    private Long leadId;
    private Long deliveryLeadId;
    private String status;
    private String hrCoordinatorEmail;
    private String financeTeamEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Derived fields from joins
    private String clientName;
    private String leadName;
    private String deliveryLeadName;
}
