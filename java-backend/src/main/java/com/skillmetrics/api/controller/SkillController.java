package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillDto> getSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getSkillById(id));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getSkillsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByUserId(userId));
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> searchSkillsByName(@RequestParam String keyword) {
        return ResponseEntity.ok(skillService.searchSkillsByName(keyword));
    }
    
    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getSkillsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(category));
    }
    
    @GetMapping("/category/{category}/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getSkillsByCategoryAndUserId(
            @PathVariable String category, @PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByCategoryAndUserId(category, userId));
    }
    
    @GetMapping("/level/{level}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getSkillsByLevel(@PathVariable String level) {
        return ResponseEntity.ok(skillService.getSkillsByLevel(level));
    }
    
    @GetMapping("/verified/{verified}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getVerifiedSkills(@PathVariable boolean verified) {
        return ResponseEntity.ok(skillService.getVerifiedSkills(verified));
    }
    
    @GetMapping("/top-endorsed")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> getTopSkillsByEndorsements(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(skillService.getTopSkillsByEndorsements(limit));
    }
    
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(skillService.getAllCategories());
    }
    
    @GetMapping("/levels")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<String>> getAllLevels() {
        return ResponseEntity.ok(skillService.getAllLevels());
    }
    
    @GetMapping("/search/user-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> searchSkillsByUserName(@RequestParam String keyword) {
        return ResponseEntity.ok(skillService.searchSkillsByUserName(keyword));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillDto> createSkill(@Valid @RequestBody SkillDto skillDto) {
        return ResponseEntity.ok(skillService.createSkill(skillDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable Long id, 
            @Valid @RequestBody SkillDto skillDto) {
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/endorse")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillDto> endorseSkill(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.endorseSkill(id));
    }
    
    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SkillDto> verifySkill(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.verifySkill(id));
    }
}
