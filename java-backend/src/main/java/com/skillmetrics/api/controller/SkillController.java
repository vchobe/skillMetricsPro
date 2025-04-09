package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SkillDto> getSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getSkillById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByUserId(userId));
    }
    
    @GetMapping("/user/{userId}/category/{category}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserIdAndCategory(
            @PathVariable Long userId, 
            @PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByUserIdAndCategory(userId, category));
    }
    
    @GetMapping("/user/{userId}/level/{level}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserIdAndLevel(
            @PathVariable Long userId, 
            @PathVariable String level) {
        return ResponseEntity.ok(skillService.getSkillsByUserIdAndLevel(userId, level));
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(skillService.getAllCategories());
    }
    
    @GetMapping("/levels")
    public ResponseEntity<List<String>> getAllLevels() {
        return ResponseEntity.ok(skillService.getAllLevels());
    }
    
    @GetMapping("/search/user/{userId}")
    public ResponseEntity<List<SkillDto>> searchUserSkills(
            @PathVariable Long userId, 
            @RequestParam String term) {
        return ResponseEntity.ok(skillService.searchUserSkills(userId, term));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<SkillDto>> searchSkills(@RequestParam String term) {
        return ResponseEntity.ok(skillService.searchSkills(term));
    }
    
    @GetMapping("/top-endorsed")
    public ResponseEntity<List<SkillDto>> getTopEndorsedSkills() {
        return ResponseEntity.ok(skillService.getTopEndorsedSkills());
    }
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillDto> createSkill(
            @Valid @RequestBody SkillDto skillDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // If userId is not explicitly set, use the current user's ID
        if (skillDto.getUserId() == null) {
            skillDto.setUserId(currentUser.getId());
        }
        
        // Only users with admin role can create skills for other users
        if (!currentUser.getId().equals(skillDto.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.createSkill(skillDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody SkillDto skillDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // Get the skill to check ownership
        SkillDto existingSkill = skillService.getSkillById(id);
        
        // Only the skill owner or admin can update the skill
        if (!currentUser.getId().equals(existingSkill.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSkill(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        // Get the skill to check ownership
        SkillDto existingSkill = skillService.getSkillById(id);
        
        // Only the skill owner or admin can delete the skill
        if (!currentUser.getId().equals(existingSkill.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
    
    // Endorsement endpoints
    
    @PostMapping("/endorsements")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EndorsementDto> endorseSkill(
            @Valid @RequestBody EndorsementDto endorsementDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // If endorserId is not explicitly set, use the current user's ID
        if (endorsementDto.getEndorserId() == null) {
            endorsementDto.setEndorserId(currentUser.getId());
        }
        
        // Only the current user or admin can create endorsements on behalf of the user
        if (!currentUser.getId().equals(endorsementDto.getEndorserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.endorseSkill(endorsementDto));
    }
    
    @DeleteMapping("/endorsements/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeEndorsement(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        skillService.removeEndorsement(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/endorsements/skill/{skillId}")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillService.getEndorsementsBySkillId(skillId));
    }
    
    @GetMapping("/endorsements/user/{endorserId}")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsByEndorserId(@PathVariable Long endorserId) {
        return ResponseEntity.ok(skillService.getEndorsementsByEndorserId(endorserId));
    }
}
