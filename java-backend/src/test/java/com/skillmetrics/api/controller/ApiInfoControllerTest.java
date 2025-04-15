package com.skillmetrics.api.controller;

import com.skillmetrics.api.util.TestUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiInfoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    public void setUp() {
        // No specific setup needed for this test
    }

    @Test
    public void testGetApiInfo() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/info"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        assertFalse(content.isEmpty());
        
        // Convert to Map and verify basic structure
        Map<String, Object> apiInfo = TestUtil.fromJsonString(content, Map.class);
        
        // Verify structure
        assertTrue(apiInfo.containsKey("name"));
        assertTrue(apiInfo.containsKey("version"));
        assertTrue(apiInfo.containsKey("environment"));
        assertTrue(apiInfo.containsKey("status"));
        assertTrue(apiInfo.containsKey("runtime"));
        assertTrue(apiInfo.containsKey("system"));
        assertTrue(apiInfo.containsKey("memory"));
        
        // Verify runtime info
        Map<String, Object> runtime = (Map<String, Object>) apiInfo.get("runtime");
        assertTrue(runtime.containsKey("startTime"));
        assertTrue(runtime.containsKey("uptime"));
        assertTrue(runtime.containsKey("currentTime"));
        
        // Verify system info
        Map<String, Object> system = (Map<String, Object>) apiInfo.get("system");
        assertTrue(system.containsKey("javaVersion"));
        assertTrue(system.containsKey("javaVendor"));
        assertTrue(system.containsKey("osName"));
        assertTrue(system.containsKey("osVersion"));
        assertTrue(system.containsKey("processors"));
        
        // Verify memory info
        Map<String, Object> memory = (Map<String, Object>) apiInfo.get("memory");
        assertTrue(memory.containsKey("maxMemoryMB"));
        assertTrue(memory.containsKey("totalMemoryMB"));
        assertTrue(memory.containsKey("freeMemoryMB"));
        assertTrue(memory.containsKey("usedMemoryMB"));
    }
}