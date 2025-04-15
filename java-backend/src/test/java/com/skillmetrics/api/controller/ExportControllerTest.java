package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ExportDto;
import com.skillmetrics.api.dto.ExportRequestDto;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.ExportService;
import com.skillmetrics.api.util.TestUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExportService exportService;

    private Long userId = 1L;

    @BeforeEach
    public void setUp() {
        // Setup authentication for protected endpoints
        TestUtil.setUpUserAuthentication("admin@example.com", "ADMIN");
        
        // Get the authenticated user ID from the security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            userId = ((UserPrincipal) authentication.getPrincipal()).getId();
        }
        
        // Setup mock service responses
        ExportDto mockExport = new ExportDto();
        mockExport.setId(1L);
        mockExport.setUserId(userId);
        mockExport.setFileName("test-export.pdf");
        mockExport.setFormat("pdf");
        mockExport.setCreatedAt(LocalDateTime.now());
        
        List<ExportDto> mockExports = Collections.singletonList(mockExport);
        
        when(exportService.getUserExports(anyLong())).thenReturn(mockExports);
        when(exportService.getAllExports(anyInt(), anyInt())).thenReturn(mockExports);
        when(exportService.getExportById(anyLong())).thenReturn(mockExport);
        when(exportService.createExport(anyLong(), anyString())).thenReturn(mockExport);
        when(exportService.createAdvancedExport(any(ExportRequestDto.class))).thenReturn(mockExport);
    }

    @Test
    public void testGetUserExports() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/exports/user"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to List and verify
        List response = TestUtil.fromJsonString(content, List.class);
        assertFalse(response.isEmpty());
    }

    @Test
    public void testGetAllExports() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/exports"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to List and verify
        List response = TestUtil.fromJsonString(content, List.class);
        assertFalse(response.isEmpty());
    }

    @Test
    public void testGetExportById() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/exports/1"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        assertEquals(1, response.get("id"));
        assertEquals(userId, response.get("userId"));
    }

    @Test
    public void testCreateExport() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(
                TestUtil.getRequest("/api/exports?format=pdf"))
                .andExpect(status().isCreated())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        assertEquals(1, response.get("id"));
        assertEquals("pdf", response.get("format"));
    }

    @Test
    public void testCreateAdvancedExport() throws Exception {
        // Create export request
        ExportRequestDto requestDto = new ExportRequestDto();
        requestDto.setFormat("pdf");
        requestDto.setType("skills");
        
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(
                TestUtil.postRequest("/api/exports/advanced", requestDto))
                .andExpect(status().isCreated())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        assertEquals(1, response.get("id"));
        assertEquals("pdf", response.get("format"));
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        // Clear authentication
        TestUtil.clearAuthentication();
        
        // Try to access protected endpoint without authentication
        mockMvc.perform(TestUtil.getRequest("/api/exports/user"))
                .andExpect(status().isUnauthorized());
    }
}