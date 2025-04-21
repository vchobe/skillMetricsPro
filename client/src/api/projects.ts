import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Projects API service
 */

// Project model
export interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  confluenceLink?: string;
  leadId?: number;
  deliveryLeadId?: number;
  status: string;
  hrCoordinatorEmail?: string;
  financeTeamEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

// Project creation request
export interface CreateProjectRequest {
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  confluenceLink?: string;
  leadId?: number;
  deliveryLeadId?: number;
  status: string;
  hrCoordinatorEmail?: string;
  financeTeamEmail?: string;
}

// Project update request
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  confluenceLink?: string;
  leadId?: number;
  deliveryLeadId?: number;
  status?: string;
  hrCoordinatorEmail?: string;
  financeTeamEmail?: string;
}

// Project resource model
export interface ProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  allocation?: number; // Percentage of time allocated
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Project resource request
export interface ProjectResourceRequest {
  userId: number;
  role: string;
  allocation?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// Project skill model
export interface ProjectSkill {
  id: number;
  projectId: number;
  skillId: number;
  requiredLevel: string;
  createdAt: string;
  updatedAt?: string;
}

// Project skill request
export interface ProjectSkillRequest {
  skillId: number;
  requiredLevel: string;
}

// Resource history model
export interface ResourceHistory {
  id: number;
  projectId: number;
  userId: number;
  action: string;
  previousRole?: string;
  newRole?: string;
  previousAllocation?: number;
  newAllocation?: number;
  date: string;
  performedById?: number;
  note?: string;
}

// Get all projects
export const getAllProjects = async (): Promise<Project[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch projects');
  }

  return response.json();
};

// Get a specific project by ID
export const getProjectById = async (projectId: number): Promise<Project> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch project');
  }

  return response.json();
};

// Create a new project
export const createProject = async (projectData: CreateProjectRequest): Promise<Project> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create project');
  }

  return response.json();
};

// Update an existing project
export const updateProject = async (projectId: number, projectData: UpdateProjectRequest): Promise<Project> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update project');
  }

  return response.json();
};

// Delete a project
export const deleteProject = async (projectId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete project');
  }
};

// Get project resources
export const getProjectResources = async (projectId: number): Promise<ProjectResource[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resources`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch project resources');
  }

  return response.json();
};

// Add a resource to a project
export const addProjectResource = async (projectId: number, resourceData: ProjectResourceRequest): Promise<ProjectResource> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resources`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add project resource');
  }

  return response.json();
};

// Update a project resource
export const updateProjectResource = async (
  projectId: number, 
  resourceId: number, 
  resourceData: Partial<ProjectResourceRequest>
): Promise<ProjectResource> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resources/${resourceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update project resource');
  }

  return response.json();
};

// Remove a resource from a project
export const removeProjectResource = async (projectId: number, resourceId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resources/${resourceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove project resource');
  }
};

// Get project skills
export const getProjectSkills = async (projectId: number): Promise<ProjectSkill[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch project skills');
  }

  return response.json();
};

// Add a skill to a project
export const addProjectSkill = async (projectId: number, skillData: ProjectSkillRequest): Promise<ProjectSkill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skillData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add project skill');
  }

  return response.json();
};

// Update a project skill
export const updateProjectSkill = async (
  projectId: number, 
  skillId: number, 
  skillData: { requiredLevel: string }
): Promise<ProjectSkill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills/${skillId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skillData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update project skill');
  }

  return response.json();
};

// Remove a skill from a project
export const removeProjectSkill = async (projectId: number, skillId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills/${skillId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove project skill');
  }
};

// Get resource history for a project
export const getResourceHistory = async (projectId: number): Promise<ResourceHistory[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resource-history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch resource history');
  }

  return response.json();
};