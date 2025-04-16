package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceHistoryDto {

    private Long id;
    
    private Long projectResourceId;
    
    private Long projectId;
    
    private String projectName; // For display purposes
    
    private Long userId;
    
    private String userName; // For display purposes
    
    private String action; // added, removed, role_changed, allocation_changed
    
    private String previousRole;
    
    private String newRole;
    
    private Integer previousAllocation;
    
    private Integer newAllocation;
    
    private Long performedById;
    
    private String performedByName; // For display purposes
    
    private String note;
    
    private LocalDateTime date;
    
    // Alias for date to maintain compatibility with standard naming conventions
    private LocalDateTime createdAt;
}
