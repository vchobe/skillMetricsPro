import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Reports API service
 */

// Report format options
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv'
}

// Report generation options
export interface ReportOptions {
  format?: ReportFormat;
  startDate?: string;
  endDate?: string;
  userId?: number;
  projectId?: number;
  clientId?: number;
  skillId?: number;
  skillCategory?: string;
  skillLevel?: string;
  includeHistory?: boolean;
  includeEndorsements?: boolean;
  includeProjects?: boolean;
  includeProfileData?: boolean;
}

// Generate a skill matrix report
export const generateSkillMatrixPdfReport = async (options: ReportOptions = {}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.format) queryParams.append('format', options.format);
  if (options.skillCategory) queryParams.append('category', options.skillCategory);
  if (options.skillLevel) queryParams.append('level', options.skillLevel);
  if (options.includeEndorsements !== undefined) queryParams.append('includeEndorsements', options.includeEndorsements.toString());

  const url = `${API_BASE_URL}/reports/skill-matrix?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': options.format === ReportFormat.PDF ? 'application/pdf' : 'application/octet-stream',
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate skill matrix report');
    } catch (e) {
      throw new Error(`Failed to generate skill matrix report: ${response.statusText}`);
    }
  }

  return response.blob();
};

// Generate a project skills report
export const generateProjectSkillsReport = async (projectId: number, options: ReportOptions = {}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.format) queryParams.append('format', options.format);

  const url = `${API_BASE_URL}/reports/project-skills/${projectId}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': options.format === ReportFormat.PDF ? 'application/pdf' : 'application/octet-stream',
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate project skills report');
    } catch (e) {
      throw new Error(`Failed to generate project skills report: ${response.statusText}`);
    }
  }

  return response.blob();
};

// Generate a resource utilization report
export const generateResourceUtilizationReport = async (options: ReportOptions = {}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.format) queryParams.append('format', options.format);
  if (options.startDate) queryParams.append('startDate', options.startDate);
  if (options.endDate) queryParams.append('endDate', options.endDate);
  if (options.projectId) queryParams.append('projectId', options.projectId.toString());

  const url = `${API_BASE_URL}/reports/resource-utilization?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': options.format === ReportFormat.PDF ? 'application/pdf' : 'application/octet-stream',
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate resource utilization report');
    } catch (e) {
      throw new Error(`Failed to generate resource utilization report: ${response.statusText}`);
    }
  }

  return response.blob();
};

// Generate a user skills profile report
export const generateUserSkillsReport = async (userId: number, options: ReportOptions = {}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.format) queryParams.append('format', options.format);
  if (options.includeHistory !== undefined) queryParams.append('includeHistory', options.includeHistory.toString());
  if (options.includeEndorsements !== undefined) queryParams.append('includeEndorsements', options.includeEndorsements.toString());
  if (options.includeProjects !== undefined) queryParams.append('includeProjects', options.includeProjects.toString());

  const url = `${API_BASE_URL}/reports/user-skills/${userId}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': options.format === ReportFormat.PDF ? 'application/pdf' : 'application/octet-stream',
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate user skills report');
    } catch (e) {
      throw new Error(`Failed to generate user skills report: ${response.statusText}`);
    }
  }

  return response.blob();
};

// Generate a team capabilities report
export const generateTeamCapabilitiesReport = async (options: ReportOptions = {}): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.format) queryParams.append('format', options.format);
  if (options.projectId) queryParams.append('projectId', options.projectId.toString());
  if (options.skillCategory) queryParams.append('category', options.skillCategory);

  const url = `${API_BASE_URL}/reports/team-capabilities?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': options.format === ReportFormat.PDF ? 'application/pdf' : 'application/octet-stream',
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate team capabilities report');
    } catch (e) {
      throw new Error(`Failed to generate team capabilities report: ${response.statusText}`);
    }
  }

  return response.blob();
};

// Helper function to download a blob as a file
export const downloadBlob = (blob: Blob, filename: string): void => {
  // Create an invisible A element
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);

  // Create a URL for the blob
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;

  // Click the element
  a.click();

  // Clean up
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};