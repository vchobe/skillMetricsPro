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
public class ProjectResourceHistoryDto {
    
    private Long id;
    
    private Long projectId;
    
    private String projectName;
    
    private Long userId;
    
    private String userName;
    
    private String action;  // added, removed, role_changed, allocation_changed
    
    private String previousRole;
    
    private String newRole;
    
    private Integer previousAllocation;
    
    private Integer newAllocation;
    
    private LocalDateTime date;
    
    private Long performedById;
    
    private String performedByName;
    
    private String note;
}