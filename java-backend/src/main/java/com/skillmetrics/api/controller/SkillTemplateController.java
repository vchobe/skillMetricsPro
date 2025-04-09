package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillTemplateDto;
import com.skillmetrics.api.service.SkillTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skill-templates")
@RequiredArgsConstructor
public class SkillTemplateController {

    private final SkillTemplateService skillTemplateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillTemplateDto>> getAllTemplates() {
        return ResponseEntity.ok(skillTemplateService.getAllTemplates());
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillTemplateDto>> getAllActiveTemplates() {
        return ResponseEntity.ok(skillTemplateService.getAllActiveTemplates());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillTemplateDto> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(skillTemplateService.getTemplateById(id));
    }
    
    @GetMapping("/name/{name}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<SkillTemplateDto> getTemplateByName(@PathVariable String name) {
        return ResponseEntity.ok(skillTemplateService.getTemplateByName(name));
    }
    
    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillTemplateDto>> getTemplatesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(skillTemplateService.getTemplatesByCategory(category));
    }
    
    @GetMapping("/creator/{createdById}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillTemplateDto>> getTemplatesByCreator(@PathVariable Long createdById) {
        return ResponseEntity.ok(skillTemplateService.getTemplatesByCreator(createdById));
    }
    
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(skillTemplateService.getAllCategories());
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillTemplateDto>> searchTemplates(@RequestParam String term) {
        return ResponseEntity.ok(skillTemplateService.searchTemplates(term));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SkillTemplateDto> createTemplate(@Valid @RequestBody SkillTemplateDto templateDto) {
        return ResponseEntity.ok(skillTemplateService.createTemplate(templateDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SkillTemplateDto> updateTemplate(
            @PathVariable Long id, @Valid @RequestBody SkillTemplateDto templateDto) {
        return ResponseEntity.ok(skillTemplateService.updateTemplate(id, templateDto));
    }
    
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SkillTemplateDto> activateTemplate(@PathVariable Long id) {
        SkillTemplateDto templateDto = skillTemplateService.getTemplateById(id);
        templateDto.setActive(true);
        return ResponseEntity.ok(skillTemplateService.updateTemplate(id, templateDto));
    }
    
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SkillTemplateDto> deactivateTemplate(@PathVariable Long id) {
        SkillTemplateDto templateDto = skillTemplateService.getTemplateById(id);
        templateDto.setActive(false);
        return ResponseEntity.ok(skillTemplateService.updateTemplate(id, templateDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        skillTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
