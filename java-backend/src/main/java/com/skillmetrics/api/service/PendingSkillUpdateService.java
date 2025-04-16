package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.PendingSkillUpdateDto;
import com.skillmetrics.api.exception.BadRequestException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.PendingSkillUpdate;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.PendingSkillUpdateRepository;
import com.skillmetrics.api.repository.SkillHistoryRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PendingSkillUpdateService {
    
    private final PendingSkillUpdateRepository pendingSkillUpdateRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final SkillHistoryRepository skillHistoryRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    /**
     * Get all pending skill updates
     */
    public List<PendingSkillUpdateDto> getAllPendingSkillUpdates() {
        List<PendingSkillUpdate> updates = pendingSkillUpdateRepository.findAll();
        
        // Get all users for enrichment
        List<Long> userIds = updates.stream()
                .flatMap(update -> {
                    if (update.getReviewerId() != null) {
                        return List.of(update.getUserId(), update.getReviewerId()).stream();
                    } else {
                        return List.of(update.getUserId()).stream();
                    }
                })
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, user -> user));
        
        return updates.stream()
                .map(update -> mapToDto(update, userMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get pending skill updates by status
     */
    public List<PendingSkillUpdateDto> getPendingSkillUpdatesByStatus(String status) {
        List<PendingSkillUpdate> updates = pendingSkillUpdateRepository.findByStatus(status);
        
        // Get all users for enrichment
        List<Long> userIds = updates.stream()
                .flatMap(update -> {
                    if (update.getReviewerId() != null) {
                        return List.of(update.getUserId(), update.getReviewerId()).stream();
                    } else {
                        return List.of(update.getUserId()).stream();
                    }
                })
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, user -> user));
        
        return updates.stream()
                .map(update -> mapToDto(update, userMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get pending skill updates by user ID
     */
    public List<PendingSkillUpdateDto> getPendingSkillUpdatesByUserId(Long userId) {
        // Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        List<PendingSkillUpdate> updates = pendingSkillUpdateRepository.findByUserId(userId);
        
        // Get all reviewers for enrichment
        List<Long> reviewerIds = updates.stream()
                .map(PendingSkillUpdate::getReviewerId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> reviewerMap = userRepository.findAllById(reviewerIds)
                .stream().collect(Collectors.toMap(User::getId, reviewer -> reviewer));
        
        Map<Long, User> userMap = Map.of(userId, user);
        userMap.putAll(reviewerMap);
        
        return updates.stream()
                .map(update -> mapToDto(update, userMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get pending skill updates by user ID and status
     */
    public List<PendingSkillUpdateDto> getPendingSkillUpdatesByUserIdAndStatus(Long userId, String status) {
        // Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        List<PendingSkillUpdate> updates = pendingSkillUpdateRepository.findByUserIdAndStatus(userId, status);
        
        // Get all reviewers for enrichment
        List<Long> reviewerIds = updates.stream()
                .map(PendingSkillUpdate::getReviewerId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> reviewerMap = userRepository.findAllById(reviewerIds)
                .stream().collect(Collectors.toMap(User::getId, reviewer -> reviewer));
        
        Map<Long, User> userMap = Map.of(userId, user);
        userMap.putAll(reviewerMap);
        
        return updates.stream()
                .map(update -> mapToDto(update, userMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get pending skill updates assigned to a reviewer
     */
    public List<PendingSkillUpdateDto> getPendingSkillUpdatesByReviewerId(Long reviewerId) {
        // Check if reviewer exists
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + reviewerId));
        
        List<PendingSkillUpdate> updates = pendingSkillUpdateRepository.findByReviewerId(reviewerId);
        
        // Get all users for enrichment
        List<Long> userIds = updates.stream()
                .map(PendingSkillUpdate::getUserId)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> userMap = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, user -> user));
        
        userMap.put(reviewerId, reviewer);
        
        return updates.stream()
                .map(update -> mapToDto(update, userMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get a pending skill update by ID
     */
    public PendingSkillUpdateDto getPendingSkillUpdateById(Long id) {
        PendingSkillUpdate update = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Get user and reviewer
        User user = userRepository.findById(update.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + update.getUserId()));
        
        Map<Long, User> userMap = Map.of(update.getUserId(), user);
        
        if (update.getReviewerId() != null) {
            userRepository.findById(update.getReviewerId())
                    .ifPresent(reviewer -> userMap.put(update.getReviewerId(), reviewer));
        }
        
        return mapToDto(update, userMap);
    }
    
    /**
     * Create a new pending skill update
     */
    @Transactional
    public PendingSkillUpdateDto createPendingSkillUpdate(PendingSkillUpdateDto dto) {
        // Synchronize fields from Node.js to Java backend naming conventions
        dto.synchronizeFields();
        
        // Check if user exists
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        
        // If skillId is provided, check if skill exists and get its details
        if (dto.getSkillId() != null) {
            Skill skill = skillRepository.findById(dto.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + dto.getSkillId()));
            
            // Check if there's already a pending update for this skill
            Optional<PendingSkillUpdate> existingUpdate = pendingSkillUpdateRepository
                    .findByUserIdAndSkillIdAndStatus(dto.getUserId(), dto.getSkillId(), "PENDING");
            
            if (existingUpdate.isPresent()) {
                throw new BadRequestException("A pending update already exists for this skill");
            }
            
            dto.setSkillName(skill.getName());
            dto.setSkillCategory(skill.getCategory());
            dto.setCurrentLevel(skill.getLevel());
            
            // Also set Node.js compatibility fields
            dto.setName(skill.getName());
            dto.setCategory(skill.getCategory());
        } else {
            // If creating a new skill (not updating)
            // Ensure skill name is set from the Node.js field if needed
            if (dto.getSkillName() == null && dto.getName() != null) {
                dto.setSkillName(dto.getName());
            }
            
            // Ensure category is set from the Node.js field if needed
            if (dto.getSkillCategory() == null && dto.getCategory() != null) {
                dto.setSkillCategory(dto.getCategory());
            }
            
            // Ensure level is set from the Node.js field if needed
            if (dto.getProposedLevel() == null && dto.getLevel() != null) {
                dto.setProposedLevel(dto.getLevel());
            }
        }
        
        // Set default status if not provided
        if (dto.getStatus() == null || dto.getStatus().isEmpty()) {
            dto.setStatus("PENDING");
        }
        
        // Map DTO to entity (this will call synchronizeFields again)
        PendingSkillUpdate pendingSkillUpdate = mapToEntity(dto);
        
        // Use submitted_at from frontend if available, otherwise use current time
        if (dto.getSubmittedAt() != null) {
            pendingSkillUpdate.setCreatedAt(dto.getSubmittedAt());
        } else {
            pendingSkillUpdate.setCreatedAt(LocalDateTime.now());
        }
        
        // Save entity
        PendingSkillUpdate savedUpdate = pendingSkillUpdateRepository.save(pendingSkillUpdate);
        
        // Find managers to notify about the pending update
        List<User> managers = userRepository.findByRole("ROLE_MANAGER");
        
        // Send notifications to managers
        for (User manager : managers) {
            String message = "New skill level update request from " + 
                    user.getFirstName() + " " + user.getLastName() + 
                    " for " + savedUpdate.getSkillName() + " to " + 
                    savedUpdate.getProposedLevel() + " level.";
            
            notificationService.createNotification(
                    manager.getId(),
                    "New Skill Update Request",
                    message,
                    "/pending-updates/" + savedUpdate.getId()
            );
            
            // Send email notification
            emailService.sendNotificationEmail(
                    manager,
                    "New Skill Update Request",
                    message
            );
        }
        
        Map<Long, User> userMap = Map.of(savedUpdate.getUserId(), user);
        return mapToDto(savedUpdate, userMap);
    }
    
    /**
     * Assign a reviewer to a pending skill update
     */
    @Transactional
    public PendingSkillUpdateDto assignReviewer(Long id, Long reviewerId) {
        PendingSkillUpdate update = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Check if reviewer exists
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + reviewerId));
        
        // Check if the update is still pending
        if (!"PENDING".equals(update.getStatus())) {
            throw new BadRequestException("Cannot assign reviewer to a non-pending update");
        }
        
        update.setReviewerId(reviewerId);
        update.setUpdatedAt(LocalDateTime.now());
        
        PendingSkillUpdate savedUpdate = pendingSkillUpdateRepository.save(update);
        
        // Get the user who requested the update
        User user = userRepository.findById(savedUpdate.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + savedUpdate.getUserId()));
        
        // Send notification to the user
        String message = reviewer.getFirstName() + " " + reviewer.getLastName() + 
                " has been assigned to review your skill update request for " + 
                savedUpdate.getSkillName() + ".";
        
        notificationService.createNotification(
                user.getId(),
                "Reviewer Assigned",
                message,
                "/pending-updates/" + savedUpdate.getId()
        );
        
        Map<Long, User> userMap = Map.of(
                savedUpdate.getUserId(), user,
                reviewerId, reviewer
        );
        
        return mapToDto(savedUpdate, userMap);
    }
    
    /**
     * Approve a pending skill update
     */
    @Transactional
    public PendingSkillUpdateDto approvePendingSkillUpdate(Long id, String comments, Long approverId) {
        PendingSkillUpdate update = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Check if the update is still pending
        if (!"PENDING".equals(update.getStatus())) {
            throw new BadRequestException("Cannot approve a non-pending update");
        }
        
        // Set reviewer if not already set
        if (update.getReviewerId() == null) {
            update.setReviewerId(approverId);
        }
        
        // Update status and reviewer comments
        update.setStatus("APPROVED");
        update.setReviewerComments(comments);
        update.setApprovedAt(LocalDateTime.now());
        update.setUpdatedAt(LocalDateTime.now());
        
        PendingSkillUpdate savedUpdate = pendingSkillUpdateRepository.save(update);
        
        // If skillId is provided, update the skill
        if (savedUpdate.getSkillId() != null) {
            Optional<Skill> skillOpt = skillRepository.findById(savedUpdate.getSkillId());
            
            if (skillOpt.isPresent()) {
                Skill skill = skillOpt.get();
                String oldLevel = skill.getLevel();
                skill.setLevel(savedUpdate.getProposedLevel());
                skill.setUpdatedAt(LocalDateTime.now());
                skillRepository.save(skill);
                
                // Create skill history entry
                SkillHistory history = new SkillHistory();
                history.setSkillId(skill.getId());
                history.setUserId(skill.getUserId());
                history.setField("level");
                history.setOldValue(oldLevel);
                history.setNewValue(savedUpdate.getProposedLevel());
                history.setChangedBy(approverId);
                history.setChangeReason("Approved skill update request");
                history.setCreatedAt(LocalDateTime.now());
                
                skillHistoryRepository.save(history);
            }
        } else {
            // If skillId is not provided, create a new skill
            Skill newSkill = new Skill();
            newSkill.setUserId(savedUpdate.getUserId());
            newSkill.setName(savedUpdate.getSkillName());
            newSkill.setCategory(savedUpdate.getSkillCategory());
            newSkill.setLevel(savedUpdate.getProposedLevel());
            newSkill.setCreatedAt(LocalDateTime.now());
            
            Skill savedSkill = skillRepository.save(newSkill);
            
            // Create skill history entry
            SkillHistory history = new SkillHistory();
            history.setSkillId(savedSkill.getId());
            history.setUserId(savedSkill.getUserId());
            history.setField("skill");
            history.setOldValue(null);
            history.setNewValue("Created with level " + savedSkill.getLevel());
            history.setChangedBy(approverId);
            history.setChangeReason("Approved new skill request");
            history.setCreatedAt(LocalDateTime.now());
            
            skillHistoryRepository.save(history);
        }
        
        // Get user and reviewer for enrichment
        User user = userRepository.findById(savedUpdate.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + savedUpdate.getUserId()));
        
        User reviewer = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + approverId));
        
        // Send notification to the user
        String message = "Your skill update request for " + savedUpdate.getSkillName() + 
                " to " + savedUpdate.getProposedLevel() + " level has been approved.";
        
        notificationService.createNotification(
                user.getId(),
                "Skill Update Approved",
                message,
                "/skills"
        );
        
        // Send email notification
        emailService.sendNotificationEmail(
                user,
                "Skill Update Approved",
                message + "\n\nReviewer Comments: " + 
                        (comments != null ? comments : "No comments provided.")
        );
        
        Map<Long, User> userMap = Map.of(
                savedUpdate.getUserId(), user,
                approverId, reviewer
        );
        
        return mapToDto(savedUpdate, userMap);
    }
    
    /**
     * Reject a pending skill update
     */
    @Transactional
    public PendingSkillUpdateDto rejectPendingSkillUpdate(Long id, String comments, Long rejecterId) {
        PendingSkillUpdate update = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        // Check if the update is still pending
        if (!"PENDING".equals(update.getStatus())) {
            throw new BadRequestException("Cannot reject a non-pending update");
        }
        
        // Set reviewer if not already set
        if (update.getReviewerId() == null) {
            update.setReviewerId(rejecterId);
        }
        
        // Update status and reviewer comments
        update.setStatus("REJECTED");
        update.setReviewerComments(comments);
        update.setRejectedAt(LocalDateTime.now());
        update.setUpdatedAt(LocalDateTime.now());
        
        PendingSkillUpdate savedUpdate = pendingSkillUpdateRepository.save(update);
        
        // Get user and reviewer for enrichment
        User user = userRepository.findById(savedUpdate.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + savedUpdate.getUserId()));
        
        User reviewer = userRepository.findById(rejecterId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + rejecterId));
        
        // Send notification to the user
        String message = "Your skill update request for " + savedUpdate.getSkillName() + 
                " to " + savedUpdate.getProposedLevel() + " level has been rejected.";
        
        notificationService.createNotification(
                user.getId(),
                "Skill Update Rejected",
                message,
                "/pending-updates/" + savedUpdate.getId()
        );
        
        // Send email notification
        emailService.sendNotificationEmail(
                user,
                "Skill Update Rejected",
                message + "\n\nReviewer Comments: " + 
                        (comments != null ? comments : "No comments provided.")
        );
        
        Map<Long, User> userMap = Map.of(
                savedUpdate.getUserId(), user,
                rejecterId, reviewer
        );
        
        return mapToDto(savedUpdate, userMap);
    }
    
    /**
     * Delete a pending skill update
     */
    @Transactional
    public void deletePendingSkillUpdate(Long id) {
        PendingSkillUpdate update = pendingSkillUpdateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pending skill update not found with id: " + id));
        
        pendingSkillUpdateRepository.delete(update);
    }
    
    /**
     * Count pending updates
     */
    public long countPendingUpdates() {
        return pendingSkillUpdateRepository.countPendingUpdates();
    }
    
    /**
     * Count pending updates for a user
     */
    public long countPendingUpdatesForUser(Long userId) {
        return pendingSkillUpdateRepository.countPendingUpdatesForUser(userId);
    }
    
    /**
     * Map entity to DTO
     */
    private PendingSkillUpdateDto mapToDto(PendingSkillUpdate entity, Map<Long, User> userMap) {
        PendingSkillUpdateDto dto = new PendingSkillUpdateDto();
        
        // Map core Java backend fields
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setSkillId(entity.getSkillId());
        dto.setSkillName(entity.getSkillName());
        dto.setSkillCategory(entity.getSkillCategory());
        dto.setCurrentLevel(entity.getCurrentLevel());
        dto.setProposedLevel(entity.getProposedLevel());
        dto.setJustification(entity.getJustification());
        dto.setStatus(entity.getStatus());
        dto.setReviewerId(entity.getReviewerId());
        dto.setReviewerComments(entity.getReviewerComments());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setRejectedAt(entity.getRejectedAt());
        
        // Map Node.js frontend fields for compatibility
        dto.setName(entity.getSkillName());
        dto.setCategory(entity.getSkillCategory());
        dto.setLevel(entity.getProposedLevel());
        dto.setNotes(entity.getJustification());
        dto.setDescription(entity.getJustification());
        dto.setSubmittedAt(entity.getCreatedAt());
        
        // Add user information if available
        User user = userMap.get(entity.getUserId());
        if (user != null) {
            dto.setUserName(user.getFirstName() + " " + user.getLastName());
            dto.setUserEmail(user.getEmail());
        }
        
        // Add reviewer information if available
        if (entity.getReviewerId() != null) {
            User reviewer = userMap.get(entity.getReviewerId());
            if (reviewer != null) {
                dto.setReviewerName(reviewer.getFirstName() + " " + reviewer.getLastName());
                dto.setReviewerEmail(reviewer.getEmail());
            }
        }
        
        return dto;
    }
    
    /**
     * Map DTO to entity
     */
    private PendingSkillUpdate mapToEntity(PendingSkillUpdateDto dto) {
        // Synchronize fields between Node.js and Java backend naming conventions
        dto.synchronizeFields();
        
        PendingSkillUpdate entity = new PendingSkillUpdate();
        entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setSkillId(dto.getSkillId());
        
        // Use synchronized field values
        entity.setSkillName(dto.getSkillName());
        entity.setSkillCategory(dto.getSkillCategory());
        entity.setCurrentLevel(dto.getCurrentLevel());
        entity.setProposedLevel(dto.getProposedLevel());
        entity.setJustification(dto.getJustification());
        
        entity.setStatus(dto.getStatus());
        entity.setReviewerId(dto.getReviewerId());
        entity.setReviewerComments(dto.getReviewerComments());
        
        return entity;
    }
}