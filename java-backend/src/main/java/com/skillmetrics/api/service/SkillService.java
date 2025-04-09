package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Endorsement;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillTemplate;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.EndorsementRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.SkillTemplateRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final SkillTemplateRepository skillTemplateRepository;
    private final EndorsementRepository endorsementRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SkillDto getSkillById(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + id));
        
        return convertToDtoWithEndorsements(skill);
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return skillRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByUserIdAndCategory(Long userId, String category) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return skillRepository.findByUserIdAndCategory(userId, category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByUserIdAndLevel(Long userId, String level) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return skillRepository.findByUserIdAndLevel(userId, level).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return skillRepository.findAllCategories();
    }
    
    @Transactional(readOnly = true)
    public List<String> getAllLevels() {
        return skillRepository.findAllLevels();
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> searchUserSkills(Long userId, String term) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return skillRepository.searchUserSkills(userId, term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> searchSkills(String term) {
        return skillRepository.searchSkills(term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getTopEndorsedSkills() {
        return skillRepository.findTopEndorsedSkills().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillDto createSkill(SkillDto skillDto) {
        User user = userRepository.findById(skillDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + skillDto.getUserId()));
        
        // Check if the user already has this skill in the same category
        List<Skill> existingSkills = skillRepository.findByNameAndCategoryAndUserId(
                skillDto.getName(), skillDto.getCategory(), skillDto.getUserId());
        
        if (!existingSkills.isEmpty()) {
            throw new IllegalStateException("User already has the skill " + skillDto.getName() + 
                    " in category " + skillDto.getCategory());
        }
        
        Skill skill = new Skill();
        skill.setUser(user);
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        
        if (skillDto.getTemplateId() != null) {
            SkillTemplate template = skillTemplateRepository.findById(skillDto.getTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id " + skillDto.getTemplateId()));
            skill.setTemplate(template);
        }
        
        Skill savedSkill = skillRepository.save(skill);
        
        return convertToDto(savedSkill);
    }
    
    @Transactional
    public SkillDto updateSkill(Long id, SkillDto skillDto) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + id));
        
        // If trying to change the skill name/category combination, check if it already exists
        if (!skill.getName().equals(skillDto.getName()) || !skill.getCategory().equals(skillDto.getCategory())) {
            List<Skill> existingSkills = skillRepository.findByNameAndCategoryAndUserId(
                    skillDto.getName(), skillDto.getCategory(), skill.getUser().getId());
            
            if (!existingSkills.isEmpty()) {
                throw new IllegalStateException("User already has the skill " + skillDto.getName() + 
                        " in category " + skillDto.getCategory());
            }
        }
        
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        
        // Update template if provided
        if (skillDto.getTemplateId() != null) {
            if (skill.getTemplate() == null || !skill.getTemplate().getId().equals(skillDto.getTemplateId())) {
                SkillTemplate template = skillTemplateRepository.findById(skillDto.getTemplateId())
                        .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id " + skillDto.getTemplateId()));
                skill.setTemplate(template);
            }
        } else {
            skill.setTemplate(null);
        }
        
        Skill updatedSkill = skillRepository.save(skill);
        
        return convertToDto(updatedSkill);
    }
    
    @Transactional
    public void deleteSkill(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + id));
        
        // Delete all endorsements for this skill
        if (skill.getEndorsements() != null && !skill.getEndorsements().isEmpty()) {
            endorsementRepository.deleteAll(skill.getEndorsements());
        }
        
        skillRepository.delete(skill);
    }
    
    @Transactional
    public EndorsementDto endorseSkill(EndorsementDto endorsementDto) {
        Skill skill = skillRepository.findById(endorsementDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + endorsementDto.getSkillId()));
        
        User endorser = userRepository.findById(endorsementDto.getEndorserId())
                .orElseThrow(() -> new ResourceNotFoundException("Endorser not found with id " + endorsementDto.getEndorserId()));
        
        // Check if the user is trying to endorse their own skill
        if (skill.getUser().getId().equals(endorser.getId())) {
            throw new IllegalStateException("You cannot endorse your own skill");
        }
        
        // Check if the endorser has already endorsed this skill
        if (endorsementRepository.findBySkillIdAndEndorserId(
                endorsementDto.getSkillId(), endorsementDto.getEndorserId()).isPresent()) {
            throw new IllegalStateException("You have already endorsed this skill");
        }
        
        Endorsement endorsement = new Endorsement();
        endorsement.setSkill(skill);
        endorsement.setEndorser(endorser);
        endorsement.setComment(endorsementDto.getComment());
        
        Endorsement savedEndorsement = endorsementRepository.save(endorsement);
        
        // Send notification to the skill owner
        notificationService.createNotification(
                skill.getUser().getId(),
                endorser.getFirstName() + " " + endorser.getLastName() + " has endorsed your " + skill.getName() + " skill",
                "/profile",
                "endorsement"
        );
        
        // Send email notification if email service is configured
        try {
            emailService.sendSkillEndorsementEmail(
                    skill.getUser().getEmail(),
                    skill.getUser().getFirstName() + " " + skill.getUser().getLastName(),
                    endorser.getFirstName() + " " + endorser.getLastName(),
                    skill.getName()
            );
        } catch (Exception e) {
            // Log exception but don't fail the endorsement process
            System.err.println("Failed to send endorsement email: " + e.getMessage());
        }
        
        return convertEndorsementToDto(savedEndorsement);
    }
    
    @Transactional
    public void removeEndorsement(Long endorsementId, Long currentUserId) {
        Endorsement endorsement = endorsementRepository.findById(endorsementId)
                .orElseThrow(() -> new ResourceNotFoundException("Endorsement not found with id " + endorsementId));
        
        // Only the endorser can remove their own endorsement
        if (!endorsement.getEndorser().getId().equals(currentUserId)) {
            throw new IllegalStateException("You can only remove your own endorsements");
        }
        
        endorsementRepository.delete(endorsement);
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsBySkillId(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill not found with id " + skillId);
        }
        
        return endorsementRepository.findBySkillId(skillId).stream()
                .map(this::convertEndorsementToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsementsByEndorserId(Long endorserId) {
        if (!userRepository.existsById(endorserId)) {
            throw new ResourceNotFoundException("User not found with id " + endorserId);
        }
        
        return endorsementRepository.findByEndorserId(endorserId).stream()
                .map(this::convertEndorsementToDto)
                .collect(Collectors.toList());
    }
    
    // Helper methods
    
    private SkillDto convertToDto(Skill skill) {
        return SkillDto.builder()
                .id(skill.getId())
                .userId(skill.getUser().getId())
                .userName(skill.getUser().getFirstName() + " " + skill.getUser().getLastName())
                .name(skill.getName())
                .category(skill.getCategory())
                .level(skill.getLevel())
                .description(skill.getDescription())
                .certification(skill.getCertification())
                .credlyLink(skill.getCredlyLink())
                .templateId(skill.getTemplate() != null ? skill.getTemplate().getId() : null)
                .endorsementCount(skill.getEndorsements() != null ? skill.getEndorsements().size() : 0)
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt())
                .build();
    }
    
    private SkillDto convertToDtoWithEndorsements(Skill skill) {
        SkillDto dto = convertToDto(skill);
        
        if (skill.getEndorsements() != null) {
            dto.setEndorsements(skill.getEndorsements().stream()
                    .map(this::convertEndorsementToDto)
                    .collect(Collectors.toList()));
        } else {
            dto.setEndorsements(new ArrayList<>());
        }
        
        return dto;
    }
    
    private EndorsementDto convertEndorsementToDto(Endorsement endorsement) {
        return EndorsementDto.builder()
                .id(endorsement.getId())
                .skillId(endorsement.getSkill().getId())
                .skillName(endorsement.getSkill().getName())
                .endorserId(endorsement.getEndorser().getId())
                .endorserName(endorsement.getEndorser().getFirstName() + " " + endorsement.getEndorser().getLastName())
                .endorserTitle(endorsement.getEndorser().getJobTitle())
                .comment(endorsement.getComment())
                .createdAt(endorsement.getCreatedAt())
                .build();
    }
}
