package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.exception.ResourceAlreadyExistsException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Endorsement;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.EndorsementRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EndorsementService {

    private final EndorsementRepository endorsementRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final SkillHistoryService skillHistoryService;

    @Transactional(readOnly = true)
    public List<EndorsementDto> getAllEndorsements() {
        return endorsementRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public EndorsementDto getEndorsementById(Long id) {
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement", "id", id));
        
        return mapToDto(endorsement);
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsBySkillId(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        return endorsementRepository.findBySkillIdOrderByCreatedAtDesc(skillId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsByEndorserId(Long endorserId) {
        if (!userRepository.existsById(endorserId)) {
            throw new ResourceNotFoundException("User", "id", endorserId);
        }
        
        return endorsementRepository.findByEndorserId(endorserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsForUserSkills(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return endorsementRepository.findBySkillOwnerId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Double getAverageRatingForSkill(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        Double averageRating = endorsementRepository.getAverageRatingForSkill(skillId);
        return averageRating != null ? averageRating : 0.0;
    }
    
    @Transactional(readOnly = true)
    public Integer getEndorsementCountForSkill(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        return endorsementRepository.getEndorsementCountForSkill(skillId);
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsByMinimumRating(Integer minimumRating) {
        return endorsementRepository.findByRatingGreaterThanEqual(minimumRating).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public EndorsementDto createEndorsement(EndorsementDto endorsementDto) {
        Skill skill = skillRepository.findById(endorsementDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", endorsementDto.getSkillId()));
        
        User endorser = userRepository.findById(endorsementDto.getEndorserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", endorsementDto.getEndorserId()));
        
        // Check if user is trying to endorse their own skill
        if (skill.getUser().getId().equals(endorser.getId())) {
            throw new IllegalStateException("Users cannot endorse their own skills");
        }
        
        // Check if user has already endorsed this skill
        Optional<Endorsement> existingEndorsement = 
                endorsementRepository.findBySkillIdAndEndorserId(skill.getId(), endorser.getId());
        
        if (existingEndorsement.isPresent()) {
            throw new ResourceAlreadyExistsException("Endorsement", 
                "skillId and endorserId", 
                skill.getId() + " and " + endorser.getId());
        }
        
        Endorsement endorsement = new Endorsement();
        endorsement.setSkill(skill);
        endorsement.setEndorser(endorser);
        endorsement.setComment(endorsementDto.getComment());
        endorsement.setRating(endorsementDto.getRating());
        
        Endorsement savedEndorsement = endorsementRepository.save(endorsement);
        
        // Update the endorsement count on the skill
        Integer count = endorsementRepository.getEndorsementCountForSkill(skill.getId());
        skill.setEndorsementCount(count);
        skillRepository.save(skill);
        
        // Create skill history entry for the endorsement
        skillHistoryService.createSkillHistory(
            skill,
            "endorsed",
            null,
            null,
            null,
            null,
            "Endorsed with rating: " + endorsementDto.getRating(),
            endorser
        );
        
        return mapToDto(savedEndorsement);
    }
    
    @Transactional
    public EndorsementDto updateEndorsement(Long id, EndorsementDto endorsementDto) {
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement", "id", id));
        
        // Validate the current user is the endorser
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Cannot identify current user"));
        
        if (!endorsement.getEndorser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only the original endorser can update an endorsement");
        }
        
        endorsement.setComment(endorsementDto.getComment());
        endorsement.setRating(endorsementDto.getRating());
        
        Endorsement updatedEndorsement = endorsementRepository.save(endorsement);
        
        return mapToDto(updatedEndorsement);
    }
    
    @Transactional
    public void deleteEndorsement(Long id) {
        Endorsement endorsement = endorsementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement", "id", id));
        
        // Validate the current user is the endorser or an admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Cannot identify current user"));
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && !endorsement.getEndorser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only the original endorser or an admin can delete an endorsement");
        }
        
        Long skillId = endorsement.getSkill().getId();
        
        endorsementRepository.deleteById(id);
        
        // Update the endorsement count on the skill
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", skillId));
                
        Integer count = endorsementRepository.getEndorsementCountForSkill(skillId);
        skill.setEndorsementCount(count);
        skillRepository.save(skill);
    }
    
    // Helper method to map Endorsement entity to EndorsementDto
    private EndorsementDto mapToDto(Endorsement endorsement) {
        EndorsementDto dto = new EndorsementDto();
        dto.setId(endorsement.getId());
        
        dto.setSkillId(endorsement.getSkill().getId());
        dto.setSkillName(endorsement.getSkill().getName());
        
        dto.setSkillOwnerId(endorsement.getSkill().getUser().getId());
        String ownerName = endorsement.getSkill().getUser().getFirstName() + " " + 
                          endorsement.getSkill().getUser().getLastName();
        dto.setSkillOwnerName(ownerName.trim());
        
        dto.setEndorserId(endorsement.getEndorser().getId());
        String endorserName = endorsement.getEndorser().getFirstName() + " " + 
                             endorsement.getEndorser().getLastName();
        dto.setEndorserName(endorserName.trim());
        
        dto.setComment(endorsement.getComment());
        dto.setRating(endorsement.getRating());
        dto.setCreatedAt(endorsement.getCreatedAt());
        dto.setUpdatedAt(endorsement.getUpdatedAt());
        
        return dto;
    }
}
