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
public class SkillDto {
    private Long id;
    private Long userId;
    private String name;
    private String category;
    private String level;
    private String description;
    private String certification;
    private String credlyLink;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
