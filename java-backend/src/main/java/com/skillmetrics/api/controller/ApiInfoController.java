package com.skillmetrics.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for API information and status.
 * Provides general information about the API, including version, environment, and status.
 */
@RestController
@RequestMapping("/api/info")
public class ApiInfoController {

    @Value("${spring.application.name:Skill Metrics API}")
    private String applicationName;

    @Value("${spring.application.version:1.0.0}")
    private String applicationVersion;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    private final LocalDateTime startTime = LocalDateTime.now();

    /**
     * Get API information.
     *
     * @return API information including name, version, environment, and status
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getApiInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // Basic info
        info.put("name", applicationName);
        info.put("version", applicationVersion);
        info.put("environment", activeProfile);
        info.put("status", "active");
        
        // Runtime info
        Map<String, Object> runtime = new HashMap<>();
        runtime.put("startTime", startTime.format(DateTimeFormatter.ISO_DATE_TIME));
        runtime.put("uptime", calculateUptime());
        runtime.put("currentTime", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        info.put("runtime", runtime);
        
        // System info
        Map<String, Object> system = new HashMap<>();
        system.put("javaVersion", System.getProperty("java.version"));
        system.put("javaVendor", System.getProperty("java.vendor"));
        system.put("osName", System.getProperty("os.name"));
        system.put("osVersion", System.getProperty("os.version"));
        system.put("processors", Runtime.getRuntime().availableProcessors());
        info.put("system", system);
        
        // Memory info
        Map<String, Object> memory = new HashMap<>();
        long maxMemory = Runtime.getRuntime().maxMemory() / (1024 * 1024);
        long totalMemory = Runtime.getRuntime().totalMemory() / (1024 * 1024);
        long freeMemory = Runtime.getRuntime().freeMemory() / (1024 * 1024);
        memory.put("maxMemoryMB", maxMemory);
        memory.put("totalMemoryMB", totalMemory);
        memory.put("freeMemoryMB", freeMemory);
        memory.put("usedMemoryMB", totalMemory - freeMemory);
        info.put("memory", memory);
        
        return ResponseEntity.ok(info);
    }
    
    /**
     * Calculate the uptime of the application in seconds.
     *
     * @return Uptime in seconds as a string
     */
    private String calculateUptime() {
        long uptime = LocalDateTime.now().toEpochSecond(java.time.ZoneOffset.UTC) - 
                      startTime.toEpochSecond(java.time.ZoneOffset.UTC);
        
        long days = uptime / (24 * 3600);
        uptime %= (24 * 3600);
        
        long hours = uptime / 3600;
        uptime %= 3600;
        
        long minutes = uptime / 60;
        long seconds = uptime % 60;
        
        if (days > 0) {
            return String.format("%d days, %d hours, %d minutes, %d seconds", days, hours, minutes, seconds);
        } else if (hours > 0) {
            return String.format("%d hours, %d minutes, %d seconds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%d minutes, %d seconds", minutes, seconds);
        } else {
            return String.format("%d seconds", seconds);
        }
    }
}