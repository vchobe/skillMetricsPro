package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.service.EndorsementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/endorsements")
@RequiredArgsConstructor
public class EndorsementController {

    private final EndorsementService endorsementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<EndorsementDto>> getAllEndorsements() {
        return ResponseEntity.ok(endorsementService.getAllEndorsements());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<EndorsementDto> getEndorsementById(@PathVariable Long id) {
        return ResponseEntity.ok(endorsementService.getEndorsementById(id));
    }
    
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(endorsementService.getEndorsementsBySkillId(skillId));
    }
    
    @GetMapping("/endorser/{endorserId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsByEndorserId(@PathVariable Long endorserId) {
        return ResponseEntity.ok(endorsementService.getEndorsementsByEndorserId(endorserId));
    }
    
    @GetMapping("/user-skills/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsForUserSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(endorsementService.getEndorsementsForUserSkills(userId));
    }
    
    @GetMapping("/skill/{skillId}/average-rating")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Double> getAverageRatingForSkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(endorsementService.getAverageRatingForSkill(skillId));
    }
    
    @GetMapping("/skill/{skillId}/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Integer> getEndorsementCountForSkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(endorsementService.getEndorsementCountForSkill(skillId));
    }
    
    @GetMapping("/minimum-rating/{minimumRating}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsByMinimumRating(@PathVariable Integer minimumRating) {
        return ResponseEntity.ok(endorsementService.getEndorsementsByMinimumRating(minimumRating));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<EndorsementDto> createEndorsement(@Valid @RequestBody EndorsementDto endorsementDto) {
        return ResponseEntity.ok(endorsementService.createEndorsement(endorsementDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<EndorsementDto> updateEndorsement(
            @PathVariable Long id, 
            @Valid @RequestBody EndorsementDto endorsementDto) {
        return ResponseEntity.ok(endorsementService.updateEndorsement(id, endorsementDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Void> deleteEndorsement(@PathVariable Long id) {
        endorsementService.deleteEndorsement(id);
        return ResponseEntity.noContent().build();
    }
}
