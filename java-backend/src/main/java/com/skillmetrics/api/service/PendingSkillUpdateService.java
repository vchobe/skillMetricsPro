package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.PendingSkillUpdateDto;
import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.PendingSkillUpdate;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.model.enums.SkillLevel;
import com.skillmetrics.api.repository.PendingSkillUpdateRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PendingSkillUpdateService {
    
    private final PendingSkillUpdateRepository pendingSkillUpdateRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SkillHistoryService skillHistoryService;
    
    @Transactional(readOnly = true)
    public List<PendingSkillUpdateDto> getAllPendingUpdates() {
        return pendingSkillUpdateRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public PendingSkillUpdateDto getPendingUpdateById(Long id) {
        PendingSkillUpdate pendingUpdate = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        return convertToDto(pendingUpdate);
    }
    
    @Transactional(readOnly = true)
    public List<PendingSkillUpdateDto> getPendingUpdatesByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return pendingSkillUpdateRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PendingSkillUpdateDto> getPendingUpdatesBySkillId(Long skillId) {
        skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));
        
        return pendingSkillUpdateRepository.findBySkillIdOrderByCreatedAtDesc(skillId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PendingSkillUpdateDto> getPendingUpdatesByStatus(String status) {
        return pendingSkillUpdateRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public PendingSkillUpdateDto createPendingUpdate(PendingSkillUpdateDto pendingUpdateDto, Long currentUserId) {
        Skill skill = skillRepository.findById(pendingUpdateDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + pendingUpdateDto.getSkillId()));
        
        User user = skill.getUser();
        
        // Only the skill owner, admins, or managers can request updates
        User requestedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));
        
        // Create the pending update record with current and new values
        PendingSkillUpdate pendingUpdate = new PendingSkillUpdate();
        pendingUpdate.setSkill(skill);
        pendingUpdate.setUser(user);
        
        // Set current values
        pendingUpdate.setCurrentName(skill.getName());
        pendingUpdate.setCurrentCategory(skill.getCategory());
        pendingUpdate.setCurrentLevel(skill.getLevel());
        pendingUpdate.setCurrentDescription(skill.getDescription());
        pendingUpdate.setCurrentCertification(skill.getCertification());
        pendingUpdate.setCurrentCredlyLink(skill.getCredlyLink());
        
        // Set new values from the DTO
        pendingUpdate.setNewName(pendingUpdateDto.getNewName());
        pendingUpdate.setNewCategory(pendingUpdateDto.getNewCategory());
        pendingUpdate.setNewLevel(pendingUpdateDto.getNewLevel());
        pendingUpdate.setNewDescription(pendingUpdateDto.getNewDescription());
        pendingUpdate.setNewCertification(pendingUpdateDto.getNewCertification());
        pendingUpdate.setNewCredlyLink(pendingUpdateDto.getNewCredlyLink());
        
        pendingUpdate.setJustification(pendingUpdateDto.getJustification());
        pendingUpdate.setStatus("PENDING");
        pendingUpdate.setRequestedBy(requestedBy);
        pendingUpdate.setCreatedAt(LocalDateTime.now());
        
        PendingSkillUpdate savedPendingUpdate = pendingSkillUpdateRepository.save(pendingUpdate);
        
        // Notify admins and managers of the pending skill update
        List<User> adminsAndManagers = userRepository.findByRoleIn(List.of("ROLE_ADMIN", "ROLE_MANAGER"));
        for (User admin : adminsAndManagers) {
            notificationService.createNotification(
                    admin.getId(),
                    "New skill update request for " + skill.getName() + " from " + user.getFirstName() + " " + user.getLastName(),
                    "/pending-updates/" + savedPendingUpdate.getId(),
                    "skill_update_request"
            );
        }
        
        // Notify the skill owner if they didn't create the request themselves
        if (!user.getId().equals(currentUserId)) {
            notificationService.createNotification(
                    user.getId(),
                    "A skill update has been requested for your skill: " + skill.getName(),
                    "/pending-updates/" + savedPendingUpdate.getId(),
                    "skill_update_request"
            );
        }
        
        return convertToDto(savedPendingUpdate);
    }
    
    @Transactional
    public PendingSkillUpdateDto approvePendingUpdate(Long id, Long approverId) {
        PendingSkillUpdate pendingUpdate = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Only allow approving if status is PENDING
        if (!"PENDING".equals(pendingUpdate.getStatus())) {
            throw new IllegalStateException("Cannot approve a pending update that is not in PENDING status");
        }
        
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Approver not found with id: " + approverId));
        
        Skill skill = pendingUpdate.getSkill();
        
        // Save original values for history
        String oldName = skill.getName();
        String oldCategory = skill.getCategory();
        SkillLevel oldLevel = skill.getLevel();
        String oldDescription = skill.getDescription();
        String oldCertification = skill.getCertification();
        String oldCredlyLink = skill.getCredlyLink();
        
        // Update the skill with new values
        if (pendingUpdate.getNewName() != null) {
            skill.setName(pendingUpdate.getNewName());
        }
        
        if (pendingUpdate.getNewCategory() != null) {
            skill.setCategory(pendingUpdate.getNewCategory());
        }
        
        if (pendingUpdate.getNewLevel() != null) {
            skill.setLevel(pendingUpdate.getNewLevel());
        }
        
        if (pendingUpdate.getNewDescription() != null) {
            skill.setDescription(pendingUpdate.getNewDescription());
        }
        
        if (pendingUpdate.getNewCertification() != null) {
            skill.setCertification(pendingUpdate.getNewCertification());
        }
        
        if (pendingUpdate.getNewCredlyLink() != null) {
            skill.setCredlyLink(pendingUpdate.getNewCredlyLink());
        }
        
        skill.setUpdatedAt(LocalDateTime.now());
        
        // Save the updated skill
        skillRepository.save(skill);
        
        // Update the pending update status
        pendingUpdate.setStatus("APPROVED");
        pendingUpdate.setApprovedBy(approver);
        pendingUpdate.setProcessedAt(LocalDateTime.now());
        pendingUpdate.setUpdatedAt(LocalDateTime.now());
        
        // Create skill history record
        if (!oldName.equals(skill.getName())) {
            skillHistoryService.createSkillHistory(SkillHistoryDto.builder()
                    .skillId(skill.getId())
                    .userId(skill.getUser().getId())
                    .changeType("name")
                    .previousValue(oldName)
                    .newValue(skill.getName())
                    .build());
        }
        
        if (oldCategory != null && !oldCategory.equals(skill.getCategory())) {
            skillHistoryService.createSkillHistory(SkillHistoryDto.builder()
                    .skillId(skill.getId())
                    .userId(skill.getUser().getId())
                    .changeType("category")
                    .previousValue(oldCategory)
                    .newValue(skill.getCategory())
                    .build());
        }
        
        if (oldLevel != skill.getLevel()) {
            skillHistoryService.createSkillHistory(SkillHistoryDto.builder()
                    .skillId(skill.getId())
                    .userId(skill.getUser().getId())
                    .changeType("level")
                    .previousLevel(oldLevel)
                    .newLevel(skill.getLevel())
                    .build());
        }
        
        // Notify the skill owner
        notificationService.createNotification(
                skill.getUser().getId(),
                "Your skill update for " + skill.getName() + " has been approved",
                "/skills/" + skill.getId(),
                "skill_update_approved"
        );
        
        // Notify the requester if different from the owner
        if (pendingUpdate.getRequestedBy() != null && 
                !pendingUpdate.getRequestedBy().getId().equals(skill.getUser().getId())) {
            notificationService.createNotification(
                    pendingUpdate.getRequestedBy().getId(),
                    "The skill update you requested for " + skill.getName() + " has been approved",
                    "/skills/" + skill.getId(),
                    "skill_update_approved"
            );
        }
        
        PendingSkillUpdate updatedPendingUpdate = pendingSkillUpdateRepository.save(pendingUpdate);
        return convertToDto(updatedPendingUpdate);
    }
    
    @Transactional
    public PendingSkillUpdateDto rejectPendingUpdate(Long id, String rejectionReason, Long rejecterId) {
        PendingSkillUpdate pendingUpdate = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Only allow rejecting if status is PENDING
        if (!"PENDING".equals(pendingUpdate.getStatus())) {
            throw new IllegalStateException("Cannot reject a pending update that is not in PENDING status");
        }
        
        User rejecter = userRepository.findById(rejecterId)
                .orElseThrow(() -> new ResourceNotFoundException("Rejecter not found with id: " + rejecterId));
        
        // Update the pending update status
        pendingUpdate.setStatus("REJECTED");
        pendingUpdate.setRejectionReason(rejectionReason);
        pendingUpdate.setApprovedBy(rejecter); // Use the same field for rejecter
        pendingUpdate.setProcessedAt(LocalDateTime.now());
        pendingUpdate.setUpdatedAt(LocalDateTime.now());
        
        // Notify the skill owner
        notificationService.createNotification(
                pendingUpdate.getUser().getId(),
                "Your skill update for " + pendingUpdate.getSkill().getName() + " has been rejected",
                "/pending-updates/" + pendingUpdate.getId(),
                "skill_update_rejected"
        );
        
        // Notify the requester if different from the owner
        if (pendingUpdate.getRequestedBy() != null && 
                !pendingUpdate.getRequestedBy().getId().equals(pendingUpdate.getUser().getId())) {
            notificationService.createNotification(
                    pendingUpdate.getRequestedBy().getId(),
                    "The skill update you requested for " + pendingUpdate.getSkill().getName() + " has been rejected",
                    "/pending-updates/" + pendingUpdate.getId(),
                    "skill_update_rejected"
            );
        }
        
        PendingSkillUpdate updatedPendingUpdate = pendingSkillUpdateRepository.save(pendingUpdate);
        return convertToDto(updatedPendingUpdate);
    }
    
    @Transactional
    public void deletePendingUpdate(Long id) {
        PendingSkillUpdate pendingUpdate = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Only allow deleting if status is PENDING
        if (!"PENDING".equals(pendingUpdate.getStatus())) {
            throw new IllegalStateException("Cannot delete a pending update that is not in PENDING status");
        }
        
        pendingSkillUpdateRepository.delete(pendingUpdate);
    }
    
    // Helper methods for entity <-> DTO conversion
    
    private PendingSkillUpdateDto convertToDto(PendingSkillUpdate pendingUpdate) {
        PendingSkillUpdateDto dto = new PendingSkillUpdateDto();
        BeanUtils.copyProperties(pendingUpdate, dto);
        
        dto.setSkillId(pendingUpdate.getSkill().getId());
        dto.setUserId(pendingUpdate.getUser().getId());
        
        dto.setSkillName(pendingUpdate.getSkill().getName());
        dto.setUserName(pendingUpdate.getUser().getFirstName() + " " + pendingUpdate.getUser().getLastName());
        
        if (pendingUpdate.getRequestedBy() != null) {
            dto.setRequestedById(pendingUpdate.getRequestedBy().getId());
            dto.setRequestedByName(pendingUpdate.getRequestedBy().getFirstName() + " " + pendingUpdate.getRequestedBy().getLastName());
        }
        
        if (pendingUpdate.getApprovedBy() != null) {
            dto.setApprovedById(pendingUpdate.getApprovedBy().getId());
            dto.setApprovedByName(pendingUpdate.getApprovedBy().getFirstName() + " " + pendingUpdate.getApprovedBy().getLastName());
        }
        
        return dto;
    }
}