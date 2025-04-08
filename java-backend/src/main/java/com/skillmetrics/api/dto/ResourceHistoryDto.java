package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceHistoryDto {
    
    private Long id;
    
    private Long projectId;
    
    private String projectName; // For display purposes
    
    private Long userId;
    
    private String userName; // For display purposes
    
    private String action;
    
    private String previousRole;
    
    private String newRole;
    
    private Integer previousAllocation;
    
    private Integer newAllocation;
    
    private LocalDateTime date;
    
    private Long performedById;
    
    private String performedByName; // For display purposes
    
    private String note;
}
