package com.skillmetrics.api.controller;

import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.AnalyticsService;
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

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

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
        Map<String, Object> overviewAnalytics = new HashMap<>();
        overviewAnalytics.put("totalSkills", 200);
        overviewAnalytics.put("totalUsers", 50);
        overviewAnalytics.put("totalProjects", 10);
        
        when(analyticsService.getOverviewAnalytics()).thenReturn(overviewAnalytics);
        
        Map<String, Object> skillsByCategory = new HashMap<>();
        skillsByCategory.put("Programming", 50);
        skillsByCategory.put("Design", 30);
        skillsByCategory.put("Management", 20);
        
        when(analyticsService.getSkillDistributionByCategory()).thenReturn(skillsByCategory);
        
        Map<String, Object> skillsByLevel = new HashMap<>();
        skillsByLevel.put("Beginner", 40);
        skillsByLevel.put("Intermediate", 30);
        skillsByLevel.put("Advanced", 20);
        skillsByLevel.put("Expert", 10);
        
        when(analyticsService.getSkillDistributionByLevel()).thenReturn(skillsByLevel);
        
        Map<String, Object> advancedAnalytics = new HashMap<>();
        advancedAnalytics.put("skillDistribution", skillsByCategory);
        advancedAnalytics.put("certificationStatus", Collections.emptyMap());
        advancedAnalytics.put("teamAnalysis", Collections.emptyMap());
        
        when(analyticsService.getAdvancedAnalytics(any(), any())).thenReturn(advancedAnalytics);
        
        Map<String, Object> certificationReport = new HashMap<>();
        certificationReport.put("totalCertifications", 75);
        certificationReport.put("certificationsByType", Collections.emptyMap());
        
        when(analyticsService.getCertificationReport()).thenReturn(certificationReport);
    }

    @Test
    public void testGetOverviewAnalytics() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/analytics/overview"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify basic structure
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(200, response.get("totalSkills"));
        assertEquals(50, response.get("totalUsers"));
        assertEquals(10, response.get("totalProjects"));
    }

    @Test
    public void testGetSkillDistributionByCategory() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/analytics/skills/categories"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(50, response.get("Programming"));
        assertEquals(30, response.get("Design"));
        assertEquals(20, response.get("Management"));
    }

    @Test
    public void testGetSkillDistributionByLevel() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/analytics/skills/levels"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(40, response.get("Beginner"));
        assertEquals(30, response.get("Intermediate"));
        assertEquals(20, response.get("Advanced"));
        assertEquals(10, response.get("Expert"));
    }

    @Test
    public void testGetAdvancedAnalytics() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/analytics/admin/advanced-analytics"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertTrue(response.containsKey("skillDistribution"));
        assertTrue(response.containsKey("certificationStatus"));
        assertTrue(response.containsKey("teamAnalysis"));
    }

    @Test
    public void testGetCertificationReport() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/analytics/admin/certification-report"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(75, response.get("totalCertifications"));
        assertTrue(response.containsKey("certificationsByType"));
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        // Clear authentication
        TestUtil.clearAuthentication();
        
        // Try to access protected endpoint without authentication
        mockMvc.perform(TestUtil.getRequest("/api/analytics/overview"))
                .andExpect(status().isUnauthorized());
    }
}