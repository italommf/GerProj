import api from './api';

export type User = {
  id: string; // UUID
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  profile_picture_url?: string | null;
  date_joined?: string;
};

// Tipo para resposta paginada
type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<PaginatedResponse<User> | User[]>('/users/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getDevelopers(): Promise<User[]> {
    const response = await api.get<PaginatedResponse<User> | User[]>('/users/?role=desenvolvedor');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch(`/users/${id}/`, data);
    return response.data;
  },
};
