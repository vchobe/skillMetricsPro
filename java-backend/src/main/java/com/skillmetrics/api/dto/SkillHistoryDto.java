package com.skillmetrics.api.dto;

import com.skillmetrics.api.model.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillHistoryDto {

    private Long id;
    private Long skillId;
    private String skillName;
    private Long userId;
    private String username;
    private String action;
    private SkillLevel previousLevel;
    private SkillLevel newLevel;
    private String notes;
    private LocalDateTime timestamp;
}
