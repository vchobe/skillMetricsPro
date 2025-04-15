package com.skillmetrics.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController implements HealthIndicator {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    
    private final LocalDateTime startTime = LocalDateTime.now();

    /**
     * Basic health check endpoint
     */
    @GetMapping
    public ResponseEntity<Health> getHealth() {
        return ResponseEntity.ok(health());
    }

    /**
     * Detailed health metrics for monitoring
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> healthMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        
        // System information
        metrics.put("status", "UP");
        metrics.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        
        // Uptime information
        metrics.put("startTime", startTime.format(DateTimeFormatter.ISO_DATE_TIME));
        metrics.put("uptime", String.format("%s seconds", 
                LocalDateTime.now().toEpochSecond(java.time.ZoneOffset.UTC) - 
                startTime.toEpochSecond(java.time.ZoneOffset.UTC)));
        
        // Memory information
        Map<String, Object> memory = new HashMap<>();
        memory.put("heapMemoryUsed", memoryBean.getHeapMemoryUsage().getUsed());
        memory.put("heapMemoryMax", memoryBean.getHeapMemoryUsage().getMax());
        memory.put("heapMemoryPercentage", 
                (double) memoryBean.getHeapMemoryUsage().getUsed() / memoryBean.getHeapMemoryUsage().getMax() * 100);
        memory.put("nonHeapMemoryUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
        metrics.put("memory", memory);
        
        // Runtime information
        Map<String, Object> runtime = new HashMap<>();
        runtime.put("processors", Runtime.getRuntime().availableProcessors());
        runtime.put("javaVersion", System.getProperty("java.version"));
        runtime.put("javaVendor", System.getProperty("java.vendor"));
        metrics.put("runtime", runtime);
        
        // Database information
        Map<String, Object> database = new HashMap<>();
        try {
            database.put("status", "UP");
            database.put("databaseProduct", jdbcTemplate.queryForObject("SELECT version()", String.class));
            database.put("connectionClass", dataSource.getConnection().getClass().getName());
            database.put("activeConnections", getActiveConnections());
        } catch (Exception e) {
            database.put("status", "DOWN");
            database.put("error", e.getMessage());
        }
        metrics.put("database", database);
        
        return ResponseEntity.ok(metrics);
    }

    /**
     * Database connection check
     */
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> databaseHealth() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Test a simple query
            String dbVersion = jdbcTemplate.queryForObject("SELECT version()", String.class);
            result.put("status", "UP");
            result.put("databaseProduct", dbVersion);
            result.put("activeConnections", getActiveConnections());
        } catch (Exception e) {
            result.put("status", "DOWN");
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * Liveness probe endpoint for Kubernetes
     */
    @GetMapping("/liveness")
    public ResponseEntity<Map<String, String>> liveness() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        return ResponseEntity.ok(response);
    }

    /**
     * Readiness probe endpoint for Kubernetes
     */
    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        
        // Check if database is accessible
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("database", Map.of("status", "UP"));
        } catch (Exception e) {
            response.put("database", Map.of(
                "status", "DOWN",
                "error", e.getMessage()
            ));
            // Return 503 if database is not accessible
            return ResponseEntity.status(503).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up()
                    .withDetail("database", "UP")
                    .withDetail("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("database", "DOWN")
                    .withDetail("error", e.getMessage())
                    .withDetail("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                    .build();
        }
    }

    /**
     * Helper method to get active database connections
     */
    private int getActiveConnections() {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'", 
                    Integer.class);
        } catch (Exception e) {
            return -1;
        }
    }
}