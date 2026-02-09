import api from './api';

export type CardTodo = {
  id: string;
  card: string; // UUID
  label: string;
  is_original: boolean;
  status: 'pending' | 'completed' | 'blocked' | 'warning';
  status_display?: string;
  comment?: string | null;
  order: number;
  created_at?: string;
  updated_at?: string;
};

export type CardTodoCreate = {
  card: string; // UUID
  label: string;
  is_original?: boolean;
  status?: 'pending' | 'completed' | 'blocked' | 'warning';
  comment?: string | null;
  order?: number;
};

export type CardTodoUpdate = {
  label?: string;
  status?: 'pending' | 'completed' | 'blocked' | 'warning';
  comment?: string | null;
  order?: number;
};

// Tipo para resposta paginada
type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const cardTodoService = {
  async getByCard(cardId: string): Promise<CardTodo[]> {
    const response = await api.get<PaginatedResponse<CardTodo> | CardTodo[]>(`/card-todos/?card=${cardId}`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getById(id: string): Promise<CardTodo> {
    const response = await api.get(`/card-todos/${id}/`);
    return response.data;
  },

  async create(data: CardTodoCreate): Promise<CardTodo> {
    const response = await api.post('/card-todos/', data);
    return response.data;
  },

  async update(id: string, data: CardTodoUpdate): Promise<CardTodo> {
    const response = await api.patch(`/card-todos/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/card-todos/${id}/`);
  },

  async updateStatus(id: string, status: 'pending' | 'completed' | 'blocked' | 'warning'): Promise<CardTodo> {
    const response = await api.patch(`/card-todos/${id}/update-status/`, { status });
    return response.data;
  },
};
