package com.skillmetrics.api;

import com.skillmetrics.api.controller.*;
import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

/**
 * Test suite for API validation.
 * This suite runs all API controller tests to validate the API completeness.
 */
@Suite
@SelectClasses({
    ApiInfoControllerTest.class,
    SkillGapAnalysisControllerTest.class,
    ExportControllerTest.class,
    OrganizationSkillHistoryControllerTest.class,
    AnalyticsControllerTest.class,
    AllSkillsControllerTest.class
})
public class ApiValidationTestSuite {
    // This class serves as a container for the test suite
}