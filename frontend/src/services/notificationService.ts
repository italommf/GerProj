import api from './api';

export type Notification = {
  id: string;
  tipo: string;
  tipo_display?: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_criacao: string;
  card_id?: number | null;
  sprint_id?: number | null;
  project_id?: number | null;
  metadata?: Record<string, any>;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type UnreadCountResponse = {
  total: number;
  mine: number;
};

export const notificationService = {
  async getAll(params?: {
    filter?: 'mine' | 'all';
    tipo?: string;
    lida?: boolean;
    page?: number;
  }): Promise<Notification[]> {
    const allNotifications: Notification[] = [];
    const queryParams = new URLSearchParams();
    
    if (params?.filter) {
      queryParams.append('filter', params.filter);
    }
    if (params?.tipo) {
      queryParams.append('tipo', params.tipo);
    }
    if (params?.lida !== undefined) {
      queryParams.append('lida', params.lida.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    
    let nextUrl: string | null = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // Fazer requisições paginadas até obter todas as notificações
    while (nextUrl) {
      const response = await api.get<PaginatedResponse<Notification> | Notification[]>(nextUrl);
      
      if (Array.isArray(response.data)) {
        // Se não for paginado, retornar diretamente
        return response.data;
      }
      
      // Se for paginado, adicionar os resultados e verificar se há próxima página
      const paginatedData = response.data as PaginatedResponse<Notification>;
      allNotifications.push(...(paginatedData.results || []));
      
      // Se houver próxima página, extrair o caminho da URL
      if (paginatedData.next) {
        const url = new URL(paginatedData.next);
        // Remover o /api/ do início do pathname se existir, pois a baseURL já inclui /api
        let pathname = url.pathname;
        if (pathname.startsWith('/api/')) {
          pathname = pathname.substring(4); // Remove '/api'
        }
        nextUrl = pathname + url.search;
      } else {
        nextUrl = null;
      }
    }
    
    return allNotifications;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/notifications/unread_count/');
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post<Notification>(`/notifications/${id}/mark_as_read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await api.post<{ count: number }>('/notifications/mark_all_as_read/');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}/`);
  },
};
