package com.skillmetrics.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        
        // Check database connection
        try {
            boolean dbStatus = jdbcTemplate.queryForObject("SELECT 1", Boolean.class);
            response.put("database", dbStatus ? "UP" : "DOWN");
        } catch (Exception e) {
            response.put("database", "DOWN");
            response.put("database_error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "pong");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("app", "SkillMetrics API");
        response.put("version", "1.0.0");
        response.put("timestamp", System.currentTimeMillis());
        
        // Add system properties
        Map<String, String> system = new HashMap<>();
        system.put("java_version", System.getProperty("java.version"));
        system.put("os_name", System.getProperty("os.name"));
        system.put("os_version", System.getProperty("os.version"));
        system.put("os_arch", System.getProperty("os.arch"));
        response.put("system", system);
        
        return ResponseEntity.ok(response);
    }
}
