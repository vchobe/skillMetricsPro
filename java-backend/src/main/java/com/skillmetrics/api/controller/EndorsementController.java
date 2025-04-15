package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.exception.BadRequestException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Endorsement;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.EndorsementRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/endorsements")
@RequiredArgsConstructor
public class EndorsementController {

    private final EndorsementRepository endorsementRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    /**
     * Create a new endorsement
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EndorsementDto> createEndorsement(
            @Valid @RequestBody EndorsementDto endorsementDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // Validate skill exists
        Skill skill = skillRepository.findById(endorsementDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + endorsementDto.getSkillId()));
        
        // Prevent self-endorsement
        if (skill.getUserId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot endorse your own skill");
        }
        
        // Check if user has already endorsed this skill
        if (endorsementRepository.existsBySkillIdAndEndorserId(
                endorsementDto.getSkillId(), currentUser.getId())) {
            throw new BadRequestException("You have already endorsed this skill");
        }
        
        // Create new endorsement
        Endorsement endorsement = new Endorsement();
        endorsement.setSkillId(endorsementDto.getSkillId());
        endorsement.setUserId(skill.getUserId());
        endorsement.setEndorserId(currentUser.getId());
        endorsement.setComment(endorsementDto.getComment());
        endorsement.setCreatedAt(LocalDateTime.now());
        
        Endorsement savedEndorsement = endorsementRepository.save(endorsement);
        
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedEndorsement.getId())
                .toUri();
        
        return ResponseEntity.created(location)
                .body(convertToDto(savedEndorsement));
    }

    /**
     * Get all endorsements for a skill
     */
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsForSkill(@PathVariable Long skillId) {
        // Verify skill exists
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill not found with id: " + skillId);
        }
        
        List<Endorsement> endorsements = endorsementRepository.findBySkillIdOrderByCreatedAtDesc(skillId);
        
        return ResponseEntity.ok(endorsements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get all endorsements received by a user
     */
    @GetMapping("/received/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsReceivedByUser(@PathVariable Long userId) {
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        
        List<Endorsement> endorsements = endorsementRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        return ResponseEntity.ok(endorsements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get endorsements received by the current user
     */
    @GetMapping("/received/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EndorsementDto>> getMyReceivedEndorsements(
            @CurrentUser UserPrincipal currentUser) {
        
        List<Endorsement> endorsements = endorsementRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        
        return ResponseEntity.ok(endorsements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get all endorsements given by a user
     */
    @GetMapping("/given/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsGivenByUser(@PathVariable Long userId) {
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        
        List<Endorsement> endorsements = endorsementRepository.findByEndorserIdOrderByCreatedAtDesc(userId);
        
        return ResponseEntity.ok(endorsements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get endorsements given by the current user
     */
    @GetMapping("/given/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EndorsementDto>> getMyGivenEndorsements(
            @CurrentUser UserPrincipal currentUser) {
        
        List<Endorsement> endorsements = endorsementRepository.findByEndorserIdOrderByCreatedAtDesc(currentUser.getId());
        
        return ResponseEntity.ok(endorsements.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get a specific endorsement
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EndorsementDto> getEndorsement(@PathVariable Long id) {
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement not found with id: " + id));
        
        return ResponseEntity.ok(convertToDto(endorsement));
    }

    /**
     * Update an endorsement
     */
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.isEndorsementOwner(#id, authentication.principal.id)")
    public ResponseEntity<EndorsementDto> updateEndorsement(
            @PathVariable Long id,
            @Valid @RequestBody EndorsementDto endorsementDto) {
        
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement not found with id: " + id));
        
        // Only comment can be updated
        endorsement.setComment(endorsementDto.getComment());
        
        Endorsement updatedEndorsement = endorsementRepository.save(endorsement);
        
        return ResponseEntity.ok(convertToDto(updatedEndorsement));
    }

    /**
     * Delete an endorsement
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@securityService.isEndorsementOwner(#id, authentication.principal.id)")
    public ResponseEntity<?> deleteEndorsement(@PathVariable Long id) {
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement not found with id: " + id));
        
        endorsementRepository.delete(endorsement);
        
        return ResponseEntity.ok().build();
    }

    /**
     * Get top endorsers for a user
     */
    @GetMapping("/top-endorsers/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Object>> getTopEndorsersForUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "5") int limit) {
        
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        
        List<Object> topEndorsers = endorsementRepository.findTopEndorsersForUser(userId, limit);
        
        return ResponseEntity.ok(topEndorsers);
    }

    // Helper method to convert entity to DTO
    private EndorsementDto convertToDto(Endorsement endorsement) {
        EndorsementDto dto = new EndorsementDto();
        dto.setId(endorsement.getId());
        dto.setSkillId(endorsement.getSkillId());
        dto.setUserId(endorsement.getUserId());
        dto.setEndorserId(endorsement.getEndorserId());
        dto.setComment(endorsement.getComment());
        dto.setCreatedAt(endorsement.getCreatedAt());
        
        // Get skill info
        skillRepository.findById(endorsement.getSkillId()).ifPresent(skill -> {
            dto.setSkillName(skill.getName());
            dto.setSkillCategory(skill.getCategory());
        });
        
        // Get user info
        userRepository.findById(endorsement.getUserId()).ifPresent(user -> {
            dto.setUserFullName(user.getFirstName() + " " + user.getLastName());
            dto.setUserEmail(user.getEmail());
        });
        
        // Get endorser info
        userRepository.findById(endorsement.getEndorserId()).ifPresent(endorser -> {
            dto.setEndorserFullName(endorser.getFirstName() + " " + endorser.getLastName());
            dto.setEndorserEmail(endorser.getEmail());
        });
        
        return dto;
    }
}