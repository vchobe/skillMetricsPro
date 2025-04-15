package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.service.OrganizationSkillHistoryService;
import com.skillmetrics.api.util.TestUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrganizationSkillHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrganizationSkillHistoryService organizationSkillHistoryService;

    @BeforeEach
    public void setUp() {
        // Setup authentication for protected endpoints
        TestUtil.setUpUserAuthentication("admin@example.com", "ADMIN");
        
        // Setup mock service responses
        Map<String, Object> skillHistorySummary = new HashMap<>();
        skillHistorySummary.put("totalSkills", 100);
        skillHistorySummary.put("skillAddedLastMonth", 10);
        skillHistorySummary.put("skillsUpgradedLastMonth", 5);
        
        when(organizationSkillHistoryService.getOrganizationSkillHistorySummary()).thenReturn(skillHistorySummary);
        
        List<SkillHistoryDto> skillHistoryList = new ArrayList<>();
        SkillHistoryDto historyDto = new SkillHistoryDto();
        // Set properties as needed
        skillHistoryList.add(historyDto);
        
        when(organizationSkillHistoryService.getSkillHistoryByPeriod(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(skillHistoryList);
        
        when(organizationSkillHistoryService.getSkillHistoryByCategory(anyString()))
                .thenReturn(skillHistoryList);
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("growthTrend", "increasing");
        trends.put("dataPoints", Collections.emptyList());
        
        when(organizationSkillHistoryService.getSkillHistoryTrends(any(), any(), any()))
                .thenReturn(trends);
    }

    @Test
    public void testGetOrganizationSkillHistorySummary() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/org/skills/history"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify basic structure
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        
        assertEquals(100, response.get("totalSkills"));
        assertEquals(10, response.get("skillAddedLastMonth"));
        assertEquals(5, response.get("skillsUpgradedLastMonth"));
    }

    @Test
    public void testGetSkillHistoryByPeriod() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest(
                "/api/org/skills/history/period?startDate=2023-01-01&endDate=2023-12-31"))
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
    public void testGetSkillHistoryByCategory() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/org/skills/history/category/Programming"))
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
    public void testGetSkillHistoryTrends() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/org/skills/history/trends"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        assertEquals("increasing", response.get("growthTrend"));
        assertTrue(response.containsKey("dataPoints"));
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        // Clear authentication
        TestUtil.clearAuthentication();
        
        // Try to access protected endpoint without authentication
        mockMvc.perform(TestUtil.getRequest("/api/org/skills/history"))
                .andExpect(status().isUnauthorized());
    }
}