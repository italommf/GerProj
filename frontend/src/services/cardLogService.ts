import api from './api';

export type CardLog = {
  id: string;
  card: string;
  tipo_evento: string;
  tipo_evento_display?: string;
  descricao: string;
  usuario?: string | null;
  usuario_name?: string;
  usuario_role?: string;
  usuario_role_display?: string;
  data: string;
};

// Tipo para resposta paginada
type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const cardLogService = {
  getByCard: async (cardId: string): Promise<CardLog[]> => {
    const response = await api.get<PaginatedResponse<CardLog> | CardLog[]>(`/card-logs/?card=${cardId}`);
    
    // Se for um array direto, retornar
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Se for paginado, retornar os results
    const paginatedData = response.data as PaginatedResponse<CardLog>;
    return paginatedData.results || [];
  },

  create: async (data: {
    card: string;
    tipo_evento: string;
    descricao: string;
    usuario?: string | null;
  }): Promise<CardLog> => {
    const response = await api.post('/card-logs/', data);
    return response.data;
  },
};
