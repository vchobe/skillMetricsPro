package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillTemplateDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.SkillTemplate;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillTemplateRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillTemplateService {

    private final SkillTemplateRepository skillTemplateRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SkillTemplateDto> getAllTemplates() {
        return skillTemplateRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillTemplateDto> getAllActiveTemplates() {
        return skillTemplateRepository.findByActiveTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SkillTemplateDto getTemplateById(Long id) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id " + id));
        
        return convertToDto(template);
    }
    
    @Transactional(readOnly = true)
    public SkillTemplateDto getTemplateByName(String name) {
        SkillTemplate template = skillTemplateRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with name " + name));
        
        return convertToDto(template);
    }
    
    @Transactional(readOnly = true)
    public List<SkillTemplateDto> getTemplatesByCategory(String category) {
        return skillTemplateRepository.findByCategory(category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillTemplateDto> getTemplatesByCreator(Long createdById) {
        userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + createdById));
        
        return skillTemplateRepository.findByCreatedById(createdById).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return skillTemplateRepository.findAllCategories();
    }
    
    @Transactional(readOnly = true)
    public List<SkillTemplateDto> searchTemplates(String term) {
        return skillTemplateRepository.searchTemplates(term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillTemplateDto createTemplate(SkillTemplateDto templateDto) {
        // Validate that a template with the same name doesn't already exist
        skillTemplateRepository.findByName(templateDto.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("A skill template with name '" 
                            + templateDto.getName() + "' already exists");
                });
        
        User creator = userRepository.findById(templateDto.getCreatedById())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " 
                        + templateDto.getCreatedById()));
        
        SkillTemplate template = new SkillTemplate();
        template.setName(templateDto.getName());
        template.setCategory(templateDto.getCategory());
        template.setDescription(templateDto.getDescription());
        template.setCriteria(templateDto.getCriteria());
        template.setCreatedBy(creator);
        template.setActive(templateDto.getActive());
        
        SkillTemplate savedTemplate = skillTemplateRepository.save(template);
        
        return convertToDto(savedTemplate);
    }
    
    @Transactional
    public SkillTemplateDto updateTemplate(Long id, SkillTemplateDto templateDto) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id " + id));
        
        // If name is changed, check for uniqueness
        if (!template.getName().equals(templateDto.getName())) {
            skillTemplateRepository.findByName(templateDto.getName())
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("A skill template with name '" 
                                + templateDto.getName() + "' already exists");
                    });
        }
        
        template.setName(templateDto.getName());
        template.setCategory(templateDto.getCategory());
        template.setDescription(templateDto.getDescription());
        template.setCriteria(templateDto.getCriteria());
        template.setActive(templateDto.getActive());
        
        SkillTemplate updatedTemplate = skillTemplateRepository.save(template);
        
        return convertToDto(updatedTemplate);
    }
    
    @Transactional
    public void deleteTemplate(Long id) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id " + id));
        
        skillTemplateRepository.delete(template);
    }
    
    // Helper methods
    
    private SkillTemplateDto convertToDto(SkillTemplate template) {
        return SkillTemplateDto.builder()
                .id(template.getId())
                .name(template.getName())
                .category(template.getCategory())
                .description(template.getDescription())
                .criteria(template.getCriteria())
                .createdById(template.getCreatedBy().getId())
                .createdByName(template.getCreatedBy().getFirstName() + " " + template.getCreatedBy().getLastName())
                .active(template.getActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
