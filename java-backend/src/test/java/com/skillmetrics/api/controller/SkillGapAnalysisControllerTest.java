package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillGapDto;
import com.skillmetrics.api.service.SkillGapAnalysisService;
import com.skillmetrics.api.util.TestUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SkillGapAnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SkillGapAnalysisService skillGapAnalysisService;

    @BeforeEach
    public void setUp() {
        // Setup authentication for protected endpoints
        TestUtil.setUpUserAuthentication("admin@example.com", "ADMIN");
        
        // Setup mock service responses
        Map<String, Object> projectGapAnalysis = new HashMap<>();
        projectGapAnalysis.put("projectId", 1L);
        projectGapAnalysis.put("projectName", "Test Project");
        projectGapAnalysis.put("skillGaps", Collections.emptyList());
        projectGapAnalysis.put("totalGaps", 0);
        
        when(skillGapAnalysisService.getProjectSkillGapAnalysis(any())).thenReturn(projectGapAnalysis);
        
        Map<String, Object> organizationGapAnalysis = new HashMap<>();
        organizationGapAnalysis.put("totalSkills", 50);
        organizationGapAnalysis.put("totalGaps", 5);
        organizationGapAnalysis.put("gapsByCategory", Collections.emptyMap());
        organizationGapAnalysis.put("criticalGaps", Collections.emptyList());
        
        when(skillGapAnalysisService.getOrganizationSkillGapAnalysis()).thenReturn(organizationGapAnalysis);
        
        List<SkillGapDto> consolidatedGaps = new ArrayList<>();
        when(skillGapAnalysisService.getConsolidatedProjectSkillGaps()).thenReturn(consolidatedGaps);
    }

    @Test
    public void testGetProjectSkillGapAnalysis() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/skill-gap-analysis/project/1"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify basic structure
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(1L, response.get("projectId"));
        assertEquals("Test Project", response.get("projectName"));
        assertTrue(response.containsKey("skillGaps"));
        assertTrue(response.containsKey("totalGaps"));
    }

    @Test
    public void testGetOrganizationSkillGapAnalysis() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/skill-gap-analysis/organization"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify basic structure
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(50, response.get("totalSkills"));
        assertEquals(5, response.get("totalGaps"));
        assertTrue(response.containsKey("gapsByCategory"));
        assertTrue(response.containsKey("criticalGaps"));
    }

    @Test
    public void testGetConsolidatedProjectSkillGaps() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/skill-gap-analysis/projects/consolidated"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to List and verify
        List<Object> response = TestUtil.fromJsonString(content, List.class);
        assertNotNull(response);
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        // Clear authentication
        TestUtil.clearAuthentication();
        
        // Try to access protected endpoint without authentication
        mockMvc.perform(TestUtil.getRequest("/api/skill-gap-analysis/organization"))
                .andExpect(status().isUnauthorized());
    }
}