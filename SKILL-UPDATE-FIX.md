# Skill Update Feature Fix

## Issue Description

When attempting to update a skill, the system was encountering errors due to a mismatch between the HTTP methods expected by the frontend and provided by the Java backend:

1. The frontend was sending `PATCH` requests to `/api/skills/:id` but the Java backend was only configured to accept `PUT` requests at this endpoint
2. For pending skill updates, the frontend was sending to `/api/skills/pending` but the Java backend had a different endpoint structure at `/api/pending-updates`

## Changes Made

### 1. Updated SkillController

Modified the skill update endpoint to support both `PATCH` and `PUT` HTTP methods:

```java
/**
 * Update a skill
 */
@PatchMapping("/{id}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<SkillDto> updateSkill(
        @PathVariable Long id,
        @Valid @RequestBody SkillDto skillDto,
        @CurrentUser UserPrincipal currentUser) {
    
    // Get the skill to check ownership
    SkillDto existingSkill = skillService.getSkillById(id);
    
    // Only the skill owner or admin can update the skill
    if (!currentUser.getId().equals(existingSkill.getUserId()) && 
            !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
}

/**
 * Update a skill (PUT variant for backwards compatibility)
 * This is an alias for the PATCH endpoint
 */
@PutMapping("/{id}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<SkillDto> updateSkillPut(
        @PathVariable Long id,
        @Valid @RequestBody SkillDto skillDto,
        @CurrentUser UserPrincipal currentUser) {
    
    // Delegate to the PATCH method
    return updateSkill(id, skillDto, currentUser);
}
```

### 2. Created SkillPendingController

Added a compatibility controller that matches the Node.js backend URL structure:

```java
/**
 * Controller for pending skill updates - Legacy endpoint for Node.js compatibility
 * This controller provides compatibility with the existing frontend by mapping 
 * the Node.js endpoints to the Java backend.
 */
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillPendingController {

    private final PendingSkillUpdateService pendingSkillUpdateService;

    /**
     * Create a new pending skill update - Legacy endpoint
     * This endpoint is compatible with the original Node.js backend
     */
    @PostMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PendingSkillUpdateDto> createPendingSkillUpdate(
            @Valid @RequestBody PendingSkillUpdateDto dto,
            @CurrentUser UserPrincipal currentUser) {
        // Implementation...
    }

    /**
     * Get pending skill updates for the current user - Legacy endpoint
     */
    @GetMapping("/user/pending-skills")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserPendingSkillUpdates(
            @CurrentUser UserPrincipal currentUser) {
        // Implementation...
    }
    
    // Additional compatibility methods...
}
```

### 3. Enhanced PendingSkillUpdateDto

Modified the DTO to support both Java backend and Node.js frontend field naming conventions:

```java
/**
 * Data Transfer Object for PendingSkillUpdate entities
 * Includes additional fields for compatibility with the Node.js backend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PendingSkillUpdateDto {
    
    // Java backend fields
    private Long id;
    private Long userId;
    private Long skillId;
    private String skillName;
    private String skillCategory;
    private String currentLevel;
    private String proposedLevel;
    private String justification;
    private String status;
    // ...more Java fields
    
    // Fields for compatibility with Node.js backend
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("category")
    private String category;
    
    @JsonProperty("level")
    private String level;
    
    @JsonProperty("notes")
    private String notes;
    
    @JsonProperty("is_update")
    private Boolean isUpdate;
    
    @JsonProperty("submitted_at")
    private LocalDateTime submittedAt;
    
    /**
     * Synchronize Node.js fields with Java backend fields
     * This method ensures that both field sets have the same data
     */
    public PendingSkillUpdateDto synchronizeFields() {
        // Mapping logic between different field naming conventions
    }
}
```

### 4. Updated PendingSkillUpdateService

Enhanced mapping methods to synchronize between different field naming conventions:

```java
private PendingSkillUpdateDto mapToDto(PendingSkillUpdate entity, Map<Long, User> userMap) {
    PendingSkillUpdateDto dto = new PendingSkillUpdateDto();
    
    // Map core Java backend fields
    dto.setId(entity.getId());
    dto.setUserId(entity.getUserId());
    // ...more fields
    
    // Map Node.js frontend fields for compatibility
    dto.setName(entity.getSkillName());
    dto.setCategory(entity.getSkillCategory());
    dto.setLevel(entity.getProposedLevel());
    dto.setNotes(entity.getJustification());
    dto.setSubmittedAt(entity.getCreatedAt());
    
    // ...more mapping logic
    
    return dto;
}

private PendingSkillUpdate mapToEntity(PendingSkillUpdateDto dto) {
    // Synchronize fields between Node.js and Java backend naming conventions
    dto.synchronizeFields();
    
    PendingSkillUpdate entity = new PendingSkillUpdate();
    // ...mapping logic
    
    return entity;
}
```

## Testing

A comprehensive test script `test-skill-update.sh` has been created to validate that:

1. Direct skill updates work with both PATCH and PUT methods
2. Pending skill update submissions work correctly with the new compatibility endpoint
3. Retrieving pending updates works as expected

The test script simulates real API calls to ensure the fix works correctly in practice.

## Summary

The changes maintain backward compatibility with existing frontend code while properly handling the request methods and data format expected by the React application. This approach allows us to:

1. Properly receive and process both PUT and PATCH requests to update skills
2. Accept pending skill update submissions at the same endpoint path as the Node.js backend
3. Ensure field names match between both backend implementations, even with different naming conventions
4. Maintain data integrity between different field naming styles