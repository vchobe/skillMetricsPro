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
    
    private String projectName;
    
    private Long userId;
    
    private String userName;
    
    private String action;
    
    private String previousRole;
    
    private String newRole;
    
    private Integer previousAllocation;
    
    private Integer newAllocation;
    
    private LocalDateTime date;
    
    private Long performedById;
    
    private String performedByName;
    
    private String note;
}
