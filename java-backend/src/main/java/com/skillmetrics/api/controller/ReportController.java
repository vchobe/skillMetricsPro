package com.skillmetrics.api.controller;

import com.skillmetrics.api.exception.BadRequestException;
import com.skillmetrics.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    /**
     * Generate and return skill matrix report
     */
    @GetMapping("/skill-matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> generateSkillMatrixReport(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long projectId) {
        
        return ResponseEntity.ok(reportService.generateSkillMatrixReport(category, level, projectId));
    }

    /**
     * Generate and return resource utilization report
     */
    @GetMapping("/resource-utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> generateResourceUtilizationReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long projectId) {
        
        return ResponseEntity.ok(reportService.generateResourceUtilizationReport(startDate, endDate, projectId));
    }

    /**
     * Generate and return team capabilities report
     */
    @GetMapping("/team-capabilities")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> generateTeamCapabilitiesReport(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String teamId) {
        
        return ResponseEntity.ok(reportService.generateTeamCapabilitiesReport(projectId, teamId));
    }

    /**
     * Export a report as PDF or Excel
     */
    @GetMapping("/export/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Resource> exportReport(
            @PathVariable String reportType,
            @RequestParam String format,
            @RequestParam(required = false) Map<String, String> params,
            HttpServletRequest request) {
        
        if (!format.equalsIgnoreCase("pdf") && !format.equalsIgnoreCase("excel")) {
            throw new BadRequestException("Invalid format. Supported formats are 'pdf' and 'excel'.");
        }
        
        Resource resource;
        String contentType;
        
        if (format.equalsIgnoreCase("pdf")) {
            resource = reportService.exportReportAsPdf(reportType, params);
            contentType = "application/pdf";
        } else {
            resource = reportService.exportReportAsExcel(reportType, params);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        
        try {
            String filename = resource.getFilename();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.error("Failed to export report", e);
            throw new BadRequestException("Failed to export report: " + e.getMessage());
        }
    }
}