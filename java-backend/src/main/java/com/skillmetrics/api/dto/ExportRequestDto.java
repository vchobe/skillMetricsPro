package com.skillmetrics.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Data Transfer Object for export request parameters.
 * Used for creating advanced exports with specific configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequestDto {
    
    private Long userId;
    
    @NotBlank(message = "Export format is required")
    private String format; // pdf, csv, json, xlsx, xml
    
    private String type; // skills, projects, users, analytics, etc.
    
    private String name; // Custom name for the export
    
    private String description; // Optional description
    
    // Filters for the export
    private String category;
    private String level;
    private String status;
    private String role;
    private String department;
    private String location;
    
    // Date range for the export
    private String startDate;
    private String endDate;
    
    // IDs for specific entity exports
    private Long projectId;
    private Long skillId;
    private Long clientId;
    
    // Include related entities
    private Boolean includeUsers;
    private Boolean includeSkills;
    private Boolean includeProjects;
    private Boolean includeClients;
    private Boolean includeEndorsements;
    private Boolean includeCertifications;
    
    // Export customization options
    private Boolean includeHeader;
    private Boolean includeFooter;
    private Boolean includeLogo;
    private Boolean includeTimestamp;
    private Boolean includePageNumbers;
    
    // Advanced customization
    private String headerText;
    private String footerText;
    private String logoUrl;
    
    // Additional parameters for specific export types
    private Map<String, Object> additionalParams;
    
    // Setters for fluent API
    public ExportRequestDto withUserId(Long userId) {
        this.userId = userId;
        return this;
    }
    
    public ExportRequestDto withFormat(String format) {
        this.format = format;
        return this;
    }
    
    public ExportRequestDto withType(String type) {
        this.type = type;
        return this;
    }
}