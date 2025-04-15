package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillTemplateDto;
import com.skillmetrics.api.exception.BadRequestException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.SkillTemplate;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.SkillTemplateRepository;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/skill-templates")
@RequiredArgsConstructor
public class SkillTemplateController {

    private final SkillTemplateRepository skillTemplateRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    /**
     * Get all skill templates
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTemplateDto>> getAllTemplates(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String source) {
        
        List<SkillTemplate> templates;
        
        if (active != null && active) {
            templates = skillTemplateRepository.findByIsActiveTrue();
        } else if (category != null && !category.isEmpty()) {
            templates = skillTemplateRepository.findByCategory(category);
        } else if (source != null && !source.isEmpty()) {
            templates = skillTemplateRepository.findByCreationSource(source);
        } else {
            templates = skillTemplateRepository.findAll();
        }
        
        return ResponseEntity.ok(templates.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get a specific template
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillTemplateDto> getTemplate(@PathVariable Long id) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id: " + id));
        
        return ResponseEntity.ok(convertToDto(template));
    }

    /**
     * Create a new skill template
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<SkillTemplateDto> createTemplate(
            @Valid @RequestBody SkillTemplateDto templateDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // Check if template with same name and category already exists
        if (skillTemplateRepository.findByNameAndCategory(
                templateDto.getName(), templateDto.getCategory()).isPresent()) {
            throw new BadRequestException("A template with this name and category already exists");
        }
        
        SkillTemplate template = new SkillTemplate();
        template.setName(templateDto.getName());
        template.setCategory(templateDto.getCategory());
        template.setDescription(templateDto.getDescription());
        template.setDefaultLevel(templateDto.getDefaultLevel());
        template.setCreationSource(templateDto.getCreationSource());
        template.setIsActive(templateDto.getIsActive() != null ? templateDto.getIsActive() : true);
        template.setIsCertificationRequired(templateDto.getIsCertificationRequired() != null ? 
                templateDto.getIsCertificationRequired() : false);
        template.setCertificationUrl(templateDto.getCertificationUrl());
        template.setCreatedBy(currentUser.getId());
        template.setCreatedAt(LocalDateTime.now());
        
        SkillTemplate savedTemplate = skillTemplateRepository.save(template);
        
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedTemplate.getId())
                .toUri();
        
        return ResponseEntity.created(location)
                .body(convertToDto(savedTemplate));
    }

    /**
     * Update a skill template
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<SkillTemplateDto> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody SkillTemplateDto templateDto) {
        
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id: " + id));
        
        // Check if trying to update to a name+category that already exists
        skillTemplateRepository.findByNameAndCategory(templateDto.getName(), templateDto.getCategory())
                .ifPresent(existingTemplate -> {
                    if (!existingTemplate.getId().equals(id)) {
                        throw new BadRequestException("A template with this name and category already exists");
                    }
                });
        
        template.setName(templateDto.getName());
        template.setCategory(templateDto.getCategory());
        template.setDescription(templateDto.getDescription());
        template.setDefaultLevel(templateDto.getDefaultLevel());
        template.setIsActive(templateDto.getIsActive());
        template.setIsCertificationRequired(templateDto.getIsCertificationRequired());
        template.setCertificationUrl(templateDto.getCertificationUrl());
        template.setUpdatedAt(LocalDateTime.now());
        
        SkillTemplate updatedTemplate = skillTemplateRepository.save(template);
        
        return ResponseEntity.ok(convertToDto(updatedTemplate));
    }

    /**
     * Delete a skill template
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id: " + id));
        
        // Instead of deleting, mark as inactive
        template.setIsActive(false);
        template.setUpdatedAt(LocalDateTime.now());
        skillTemplateRepository.save(template);
        
        return ResponseEntity.ok().build();
    }

    /**
     * Get all template categories
     */
    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getTemplateCategories() {
        return ResponseEntity.ok(skillTemplateRepository.findAllCategories());
    }

    /**
     * Search templates
     */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTemplateDto>> searchTemplates(@RequestParam String query) {
        List<SkillTemplate> templates = skillTemplateRepository.searchTemplates(query);
        
        return ResponseEntity.ok(templates.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get templates requiring certification
     */
    @GetMapping("/certification-required")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTemplateDto>> getTemplatesRequiringCertification() {
        List<SkillTemplate> templates = skillTemplateRepository.findByIsCertificationRequiredTrue();
        
        return ResponseEntity.ok(templates.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get template usage statistics
     */
    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<Map<String, Object>> getTemplateStatistics(@PathVariable Long id) {
        SkillTemplate template = skillTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill template not found with id: " + id));
        
        Map<String, Object> statistics = new HashMap<>();
        
        // Count skills using this template (matching name and category)
        long skillCount = skillRepository.countByNameAndCategory(template.getName(), template.getCategory());
        statistics.put("usageCount", skillCount);
        
        // Count how many of those skills have certifications
        long certifiedCount = skillRepository.countByNameAndCategoryAndCertificationIsNotNull(
                template.getName(), template.getCategory());
        statistics.put("certifiedCount", certifiedCount);
        
        // Calculate certification rate
        double certificationRate = skillCount > 0 ? (double) certifiedCount / skillCount * 100 : 0;
        statistics.put("certificationRate", certificationRate);
        
        // Get distribution by level
        Map<String, Long> levelDistribution = skillRepository.findByNameAndCategory(
                template.getName(), template.getCategory())
                .stream()
                .collect(Collectors.groupingBy(s -> s.getLevel(), Collectors.counting()));
        statistics.put("levelDistribution", levelDistribution);
        
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get system-level statistics for all templates
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<Map<String, Object>> getOverallStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        // Count total templates
        long totalTemplates = skillTemplateRepository.count();
        statistics.put("totalTemplates", totalTemplates);
        
        // Count active templates
        long activeTemplates = skillTemplateRepository.findByIsActiveTrue().size();
        statistics.put("activeTemplates", activeTemplates);
        
        // Count by category
        Map<String, Long> templatesByCategory = skillTemplateRepository.findAll().stream()
                .collect(Collectors.groupingBy(SkillTemplate::getCategory, Collectors.counting()));
        statistics.put("templatesByCategory", templatesByCategory);
        
        // Count by creation source
        Map<String, Long> templatesBySource = skillTemplateRepository.findAll().stream()
                .collect(Collectors.groupingBy(t -> t.getCreationSource() != null ? 
                        t.getCreationSource() : "UNKNOWN", Collectors.counting()));
        statistics.put("templatesBySource", templatesBySource);
        
        // Count requiring certification
        long requiresCertification = skillTemplateRepository.findByIsCertificationRequiredTrue().size();
        statistics.put("requiresCertification", requiresCertification);
        
        return ResponseEntity.ok(statistics);
    }

    // Helper method to convert entity to DTO
    private SkillTemplateDto convertToDto(SkillTemplate template) {
        SkillTemplateDto dto = new SkillTemplateDto();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setCategory(template.getCategory());
        dto.setDescription(template.getDescription());
        dto.setDefaultLevel(template.getDefaultLevel());
        dto.setCreationSource(template.getCreationSource());
        dto.setIsActive(template.getIsActive());
        dto.setIsCertificationRequired(template.getIsCertificationRequired());
        dto.setCertificationUrl(template.getCertificationUrl());
        dto.setCreatedBy(template.getCreatedBy());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());
        
        // Add creator name if available
        if (template.getCreatedBy() != null) {
            userRepository.findById(template.getCreatedBy()).ifPresent(user -> {
                dto.setCreatedByName(user.getFirstName() + " " + user.getLastName());
            });
        }
        
        // Add usage statistics
        long skillCount = skillRepository.countByNameAndCategory(template.getName(), template.getCategory());
        dto.setUsageCount((int) skillCount);
        
        if (skillCount > 0) {
            long certifiedCount = skillRepository.countByNameAndCategoryAndCertificationIsNotNull(
                    template.getName(), template.getCategory());
            dto.setCertificationRate(skillCount > 0 ? (double) certifiedCount / skillCount * 100 : 0);
        } else {
            dto.setCertificationRate(0.0);
        }
        
        return dto;
    }
}