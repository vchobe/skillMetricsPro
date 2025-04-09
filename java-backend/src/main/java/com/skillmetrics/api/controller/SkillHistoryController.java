package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.service.SkillHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skill-history")
@RequiredArgsConstructor
public class SkillHistoryController {

    private final SkillHistoryService skillHistoryService;

    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillHistoryService.getHistoryBySkillId(skillId));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillHistoryService.getHistoryByUserId(userId));
    }
}
