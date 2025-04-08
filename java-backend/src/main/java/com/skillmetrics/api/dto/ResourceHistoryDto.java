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
    private Long projectId;
    private Long userId;
    private String action;
    private String previousRole;
    private String newRole;
    private Integer previousAllocation;
    private Integer newAllocation;
    private LocalDateTime date;
    private Long performedById;
    private String note;
    private LocalDateTime createdAt;
    
    // Derived fields
    private String projectName;
    private String userName;
    private String performedByName;
}
