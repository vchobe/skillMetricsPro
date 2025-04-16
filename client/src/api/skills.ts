import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Skills API service for skill management
 */

// Skill model
export interface Skill {
  id: number;
  userId: number;
  name: string;
  category: string;
  level: string;
  description?: string;
  certification?: string;
  credlyLink?: string;
  createdAt: string;
  updatedAt?: string;
}

// Skill creation request
export interface CreateSkillRequest {
  name: string;
  category: string;
  level: string;
  description?: string;
  certification?: string;
  credlyLink?: string;
}

// Skill update request
export interface UpdateSkillRequest {
  id: number;
  name?: string;
  category?: string;
  level?: string;
  description?: string;
  certification?: string;
  credlyLink?: string;
}

// Skill search parameters
export interface SkillSearchParams {
  name?: string;
  category?: string;
  level?: string;
  userId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

// Skill history entry
export interface SkillHistory {
  id: number;
  skillId: number;
  userId: number;
  oldLevel?: string;
  newLevel?: string;
  oldCategory?: string;
  newCategory?: string;
  oldName?: string;
  newName?: string;
  changeType: string;
  timestamp: string;
}

// Endorsement model
export interface Endorsement {
  id: number;
  skillId: number;
  endorserId: number;
  endorseeId: number;
  comment?: string;
  level: string;
  createdAt: string;
}

// Skill template model
export interface SkillTemplate {
  id: number;
  name: string;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

// Get all skills for the current user
export const getUserSkills = async (): Promise<Skill[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skills');
  }

  return response.json();
};

// Get skills for a specific user
export const getSkillsByUserId = async (userId: number): Promise<Skill[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skills');
  }

  return response.json();
};

// Get a specific skill by ID
export const getSkillById = async (skillId: number): Promise<Skill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill');
  }

  return response.json();
};

// Create a new skill
export const createSkill = async (skillData: CreateSkillRequest): Promise<Skill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skillData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create skill');
  }

  return response.json();
};

// Update an existing skill
export const updateSkill = async (skillId: number, skillData: UpdateSkillRequest): Promise<Skill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skillData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update skill');
  }

  return response.json();
};

// Delete a skill
export const deleteSkill = async (skillId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete skill');
  }
};

// Search for skills
export const searchSkills = async (params: SkillSearchParams): Promise<Skill[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.category) queryParams.append('category', params.category);
  if (params.level) queryParams.append('level', params.level);
  if (params.userId) queryParams.append('userId', params.userId.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const response = await fetch(`${API_BASE_URL}/skills/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search skills');
  }

  return response.json();
};

// Get skill history
export const getSkillHistory = async (skillId: number): Promise<SkillHistory[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill history');
  }

  return response.json();
};

// Get skill templates
export const getSkillTemplates = async (): Promise<SkillTemplate[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skill-templates`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch skill templates');
  }

  return response.json();
};

// Create a skill from template
export const createSkillFromTemplate = async (templateId: number, level: string): Promise<Skill> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/from-template/${templateId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ level }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create skill from template');
  }

  return response.json();
};

// Endorse a skill
export const endorseSkill = async (skillId: number, endorsement: { comment?: string, level: string }): Promise<Endorsement> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}/endorsements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(endorsement),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to endorse skill');
  }

  return response.json();
};

// Get endorsements for a skill
export const getSkillEndorsements = async (skillId: number): Promise<Endorsement[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/skills/${skillId}/endorsements`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch endorsements');
  }

  return response.json();
};