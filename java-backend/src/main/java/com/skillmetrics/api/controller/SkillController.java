package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SkillDto> getSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getSkillById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByUserId(userId));
    }
    
    @PostMapping
    public ResponseEntity<SkillDto> createSkill(@Valid @RequestBody SkillDto skillDto) {
        return new ResponseEntity<>(skillService.createSkill(skillDto), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody SkillDto skillDto) {
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<SkillDto>> getSkillsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(category));
    }
    
    @GetMapping("/level/{level}")
    public ResponseEntity<List<SkillDto>> getSkillsByLevel(@PathVariable String level) {
        return ResponseEntity.ok(skillService.getSkillsByLevel(level));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<SkillDto>> searchSkillsByName(@RequestParam String keyword) {
        return ResponseEntity.ok(skillService.searchSkillsByName(keyword));
    }
}
