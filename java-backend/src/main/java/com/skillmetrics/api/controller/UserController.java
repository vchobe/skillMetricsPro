package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }
    
    @PostMapping
    public ResponseEntity<UserDto> createUser(
            @RequestBody Map<String, Object> payload) {
        UserDto userDto = new UserDto();
        userDto.setUsername((String) payload.get("username"));
        userDto.setEmail((String) payload.get("email"));
        userDto.setFirstName((String) payload.get("firstName"));
        userDto.setLastName((String) payload.get("lastName"));
        userDto.setRole((String) payload.get("role"));
        userDto.setLocation((String) payload.get("location"));
        userDto.setProject((String) payload.get("project"));
        
        String password = (String) payload.get("password");
        
        return new ResponseEntity<>(
            userService.createUser(userDto, password),
            HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody UserDto userDto) {
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }
    
    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> updatePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        userService.updatePassword(id, payload.get("password"));
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
