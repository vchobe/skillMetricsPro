package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.SkillSummaryDto;
import com.skillmetrics.api.service.SkillService;
import com.skillmetrics.api.util.TestUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AllSkillsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SkillService skillService;

    @BeforeEach
    public void setUp() {
        // Setup authentication for protected endpoints
        TestUtil.setUpUserAuthentication("admin@example.com", "ADMIN");
        
        // Setup mock service responses
        List<SkillDto> allSkills = new ArrayList<>();
        SkillDto skill = new SkillDto();
        skill.setId(1L);
        skill.setName("Java Programming");
        skill.setCategory("Programming");
        skill.setLevel("Expert");
        allSkills.add(skill);
        
        when(skillService.getAllSkills()).thenReturn(allSkills);
        
        Page<SkillDto> skillsPage = new PageImpl<>(allSkills);
        when(skillService.getAllSkillsPaginated(any(Pageable.class))).thenReturn(skillsPage);
        
        Map<String, List<SkillDto>> skillsByCategory = new HashMap<>();
        skillsByCategory.put("Programming", allSkills);
        
        when(skillService.getSkillsGroupedByCategory()).thenReturn(skillsByCategory);
        
        Map<String, Integer> skillCountsByCategory = new HashMap<>();
        skillCountsByCategory.put("Programming", 1);
        
        when(skillService.getSkillCountsByCategory()).thenReturn(skillCountsByCategory);
        
        Map<String, Object> skillSummary = new HashMap<>();
        skillSummary.put("totalSkills", 1);
        skillSummary.put("totalCategories", 1);
        skillSummary.put("topCategory", "Programming");
        
        when(skillService.getSkillSummary()).thenReturn(skillSummary);
        
        List<SkillSummaryDto> orgSkillDetail = new ArrayList<>();
        SkillSummaryDto summaryDto = new SkillSummaryDto();
        summaryDto.setName("Java Programming");
        summaryDto.setCategory("Programming");
        summaryDto.setTotalUsers(5);
        orgSkillDetail.add(summaryDto);
        
        when(skillService.getOrganizationSkillDetail()).thenReturn(orgSkillDetail);
        
        when(skillService.getFilteredSkills(anyMap())).thenReturn(allSkills);
    }

    @Test
    public void testGetAllSkills() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/all-skills"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to List and verify
        List response = TestUtil.fromJsonString(content, List.class);
        assertFalse(response.isEmpty());
        
        Map<String, Object> skill = (Map<String, Object>) response.get(0);
        assertEquals(1, skill.get("id"));
        assertEquals("Java Programming", skill.get("name"));
        assertEquals("Programming", skill.get("category"));
        assertEquals("Expert", skill.get("level"));
    }

    @Test
    public void testGetSkillsByCategory() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/all-skills/by-category"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, List> response = TestUtil.fromJsonString(content, Map.class);
        assertTrue(response.containsKey("Programming"));
        assertFalse(response.get("Programming").isEmpty());
    }

    @Test
    public void testGetSkillCountsByCategory() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/all-skills/counts/by-category"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Integer> response = TestUtil.fromJsonString(content, Map.class);
        assertTrue(response.containsKey("Programming"));
        assertEquals(1, response.get("Programming"));
    }

    @Test
    public void testGetSkillSummary() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/all-skills/summary"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to Map and verify
        Map<String, Object> response = TestUtil.fromJsonString(content, Map.class);
        assertEquals(1, response.get("totalSkills"));
        assertEquals(1, response.get("totalCategories"));
        assertEquals("Programming", response.get("topCategory"));
    }

    @Test
    public void testGetOrganizationSkillDetail() throws Exception {
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.getRequest("/api/all-skills/organization-detail"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Extract the content
        String content = TestUtil.getContentAsString(result);
        assertNotNull(content);
        
        // Convert to List and verify
        List response = TestUtil.fromJsonString(content, List.class);
        assertFalse(response.isEmpty());
        
        Map<String, Object> summaryDto = (Map<String, Object>) response.get(0);
        assertEquals("Java Programming", summaryDto.get("name"));
        assertEquals("Programming", summaryDto.get("category"));
        assertEquals(5, summaryDto.get("totalUsers"));
    }

    @Test
    public void testGetFilteredSkills() throws Exception {
        // Create filter criteria
        Map<String, Object> filters = new HashMap<>();
        filters.put("category", "Programming");
        filters.put("level", "Expert");
        
        // Perform the request and verify status
        MvcResult result = mockMvc.perform(TestUtil.postRequest("/api/all-skills/filtered", filters))
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
    public void testProtectedEndpointWithoutAuth() throws Exception {
        // Clear authentication
        TestUtil.clearAuthentication();
        
        // Try to access protected endpoint without authentication
        mockMvc.perform(TestUtil.getRequest("/api/all-skills/organization-detail"))
                .andExpect(status().isUnauthorized());
    }
}