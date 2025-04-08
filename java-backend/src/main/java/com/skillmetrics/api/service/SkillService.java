package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.User;
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
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SkillDto getSkillById(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        return mapToDto(skill);
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return skillRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> searchSkillsByName(String keyword) {
        return skillRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByCategoryAndUserId(String category, Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return skillRepository.findByCategoryAndUserId(category, userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByLevel(String level) {
        return skillRepository.findByLevel(level).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getVerifiedSkills(boolean verified) {
        return skillRepository.findByVerified(verified).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getTopSkillsByEndorsements(int limit) {
        return skillRepository.findTopSkillsByEndorsements().stream()
                .limit(limit)
                .map(this::mapToDto)
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
    public List<SkillDto> searchSkillsByUserName(String keyword) {
        return skillRepository.findByUserNameContaining(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillDto createSkill(SkillDto skillDto) {
        User user = userRepository.findById(skillDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", skillDto.getUserId()));
        
        Skill skill = new Skill();
        skill.setUser(user);
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        skill.setVerified(skillDto.isVerified());
        skill.setEndorsementCount(0); // Initialize with zero endorsements
        
        Skill savedSkill = skillRepository.save(skill);
        
        return mapToDto(savedSkill);
    }
    
    @Transactional
    public SkillDto updateSkill(Long id, SkillDto skillDto) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        // Only change user if it's different
        if (skillDto.getUserId() != null && !skill.getUser().getId().equals(skillDto.getUserId())) {
            User user = userRepository.findById(skillDto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", skillDto.getUserId()));
            skill.setUser(user);
        }
        
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        
        // Only administrators should be able to set verified status
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            skill.setVerified(skillDto.isVerified());
        }
        
        Skill updatedSkill = skillRepository.save(skill);
        
        return mapToDto(updatedSkill);
    }
    
    @Transactional
    public void deleteSkill(Long id) {
        if (!skillRepository.existsById(id)) {
            throw new ResourceNotFoundException("Skill", "id", id);
        }
        
        skillRepository.deleteById(id);
    }
    
    @Transactional
    public SkillDto endorseSkill(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Optional<User> currentUser = userRepository.findByUsername(username);
        
        // Don't allow self-endorsement
        if (currentUser.isPresent() && skill.getUser().getId().equals(currentUser.get().getId())) {
            throw new IllegalStateException("You cannot endorse your own skill");
        }
        
        skill.setEndorsementCount(skill.getEndorsementCount() + 1);
        Skill updatedSkill = skillRepository.save(skill);
        
        return mapToDto(updatedSkill);
    }
    
    @Transactional
    public SkillDto verifySkill(Long id) {
        // Only admins can verify skills (this should be checked in the controller as well)
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        skill.setVerified(true);
        Skill updatedSkill = skillRepository.save(skill);
        
        return mapToDto(updatedSkill);
    }
    
    // Helper method to map Skill entity to SkillDto
    private SkillDto mapToDto(Skill skill) {
        SkillDto skillDto = new SkillDto();
        skillDto.setId(skill.getId());
        
        skillDto.setUserId(skill.getUser().getId());
        String userName = skill.getUser().getFirstName() + " " + skill.getUser().getLastName();
        skillDto.setUserName(userName.trim());
        
        skillDto.setName(skill.getName());
        skillDto.setCategory(skill.getCategory());
        skillDto.setLevel(skill.getLevel());
        skillDto.setDescription(skill.getDescription());
        skillDto.setCertification(skill.getCertification());
        skillDto.setCredlyLink(skill.getCredlyLink());
        skillDto.setVerified(skill.isVerified());
        skillDto.setEndorsementCount(skill.getEndorsementCount());
        skillDto.setCreatedAt(skill.getCreatedAt());
        skillDto.setUpdatedAt(skill.getUpdatedAt());
        
        return skillDto;
    }
}
