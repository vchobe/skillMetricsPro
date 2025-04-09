package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProfileHistoryDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.ProfileHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileHistoryController {
    
    private final ProfileHistoryService profileHistoryService;
    
    @GetMapping("/profile-history/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProfileHistoryDto>> getAllProfileHistory() {
        return ResponseEntity.ok(profileHistoryService.getAllProfileHistory());
    }
    
    @GetMapping("/profile-history/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<List<ProfileHistoryDto>> getProfileHistoryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(profileHistoryService.getProfileHistoryByUserId(userId));
    }
    
    @GetMapping("/profile-history/field/{fieldName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProfileHistoryDto>> getProfileHistoryByField(@PathVariable String fieldName) {
        return ResponseEntity.ok(profileHistoryService.getProfileHistoryByField(fieldName));
    }
    
    @GetMapping("/profile-history/dates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProfileHistoryDto>> getProfileHistoryBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(profileHistoryService.getProfileHistoryBetweenDates(startDate, endDate));
    }
    
    @GetMapping("/user/profile-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProfileHistoryDto>> getCurrentUserProfileHistory(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(profileHistoryService.getProfileHistoryByUserId(currentUser.getId()));
    }
    
    @PostMapping("/profile-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProfileHistoryDto> createProfileHistory(@RequestBody ProfileHistoryDto historyDto) {
        return ResponseEntity.ok(profileHistoryService.createProfileHistory(historyDto));
    }
}