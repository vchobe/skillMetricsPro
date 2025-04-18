import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Analytics API service
 */

// Skill distribution model
export interface SkillDistribution {
  category: string;
  count: number;
  percentage: number;
}

// Skill level distribution model
export interface SkillLevelDistribution {
  level: string;
  count: number;
  percentage: number;
}

// Skill growth model
export interface SkillGrowth {
  month: string;
  count: number;
}

// Team capability model
export interface TeamCapability {
  skillName: string;
  category: string;
  expertCount: number;
  intermediateCount: number;
  beginnerCount: number;
  totalCount: number;
}

// Project skill coverage model
export interface ProjectSkillCoverage {
  projectId: number;
  projectName: string;
  totalRequiredSkills: number;
  coveredSkills: number;
  percentageCovered: number;
}

// Resource utilization model
export interface ResourceUtilization {
  userId: number;
  username: string;
  fullName: string;
  totalAllocation: number;
  projectCount: number;
  projects: {
    projectId: number;
    projectName: string;
    allocation: number;
  }[];
}

// Get skill distribution analytics
export const getSkillDistribution = async (): Promise<SkillDistribution[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/analytics/skill-distribution`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill distribution');
  }

  return response.json();
};

// Get skill level distribution analytics
export const getSkillLevelDistribution = async (): Promise<SkillLevelDistribution[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/analytics/skill-levels`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill level distribution');
  }

  return response.json();
};

// Get skill growth analytics
export const getSkillGrowth = async (months: number = 12): Promise<SkillGrowth[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/analytics/skill-growth?months=${months}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill growth');
  }

  return response.json();
};

// Get team capabilities analytics
export const getTeamCapabilities = async (teamId?: number): Promise<TeamCapability[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = teamId 
    ? `${API_BASE_URL}/analytics/team-capabilities?teamId=${teamId}` 
    : `${API_BASE_URL}/analytics/team-capabilities`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch team capabilities');
  }

  return response.json();
};

// Get project skill coverage analytics
export const getProjectSkillCoverage = async (projectId?: number): Promise<ProjectSkillCoverage[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = projectId 
    ? `${API_BASE_URL}/analytics/project-skill-coverage?projectId=${projectId}` 
    : `${API_BASE_URL}/analytics/project-skill-coverage`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch project skill coverage');
  }

  return response.json();
};

// Get resource utilization analytics
export const getResourceUtilization = async (): Promise<ResourceUtilization[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/analytics/resource-utilization`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch resource utilization');
  }

  return response.json();
};

// Export analytics data to Excel
export const exportAnalyticsToExcel = async (type: string): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/analytics/export/${type}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to export analytics');
  }

  return response.blob();
};

// Generate skill matrix report (PDF)
export const generateSkillMatrixReport = async (options?: { 
  categoryFilter?: string[], 
  levelFilter?: string[] 
}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query string
  const queryParams = new URLSearchParams();
  if (options?.categoryFilter) {
    options.categoryFilter.forEach(category => {
      queryParams.append('category', category);
    });
  }
  if (options?.levelFilter) {
    options.levelFilter.forEach(level => {
      queryParams.append('level', level);
    });
  }

  const url = queryParams.toString() 
    ? `${API_BASE_URL}/reports/skill-matrix?${queryParams.toString()}` 
    : `${API_BASE_URL}/reports/skill-matrix`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate skill matrix report');
  }

  return response.blob();
};