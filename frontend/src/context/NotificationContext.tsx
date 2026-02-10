import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { notificationService, type Notification } from '@/services/notificationService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from './AuthContext';

type NotificationFilter = 'all' | 'mine' | 'unread';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  mineCount: number;
  loading: boolean;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mineCount, setMineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params: any = {};
      
      if (filter === 'mine') {
        params.filter = 'mine';
      } else if (filter === 'unread') {
        params.lida = false;
      }
      
      const data = await notificationService.getAll(params);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filter]);

  // Carregar contadores
  const loadCounts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const counts = await notificationService.getUnreadCount();
      setUnreadCount(counts.total);
      setMineCount(counts.mine);
    } catch (error) {
      console.error('Erro ao carregar contadores:', error);
    }
  }, [isAuthenticated]);

  // Handler para notificações recebidas via WebSocket
  const handleNotification = useCallback((notification: Notification) => {
    console.log('[NotificationContext] Nova notificação recebida via WebSocket:', notification);
    
    // Adicionar nova notificação no início da lista (evitando duplicatas)
    setNotifications((prev) => {
      // Verificar se já existe para evitar duplicatas
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) {
        console.log('[NotificationContext] Notificação já existe, atualizando:', notification.id);
        // Atualizar notificação existente
        return prev.map((n) => (n.id === notification.id ? notification : n));
      }
      // Adicionar nova notificação no início
      return [notification, ...prev];
    });
    
    // Atualizar contadores
    if (!notification.lida) {
      setUnreadCount((prev) => {
        const newCount = prev + 1;
        console.log('[NotificationContext] Contador de não lidas atualizado:', newCount);
        return newCount;
      });
      
      // Verificar se é notificação específica do usuário
      const generalTypes = ['sprint_created'];
      if (!generalTypes.includes(notification.tipo)) {
        setMineCount((prev) => {
          const newCount = prev + 1;
          console.log('[NotificationContext] Contador de minhas atualizado:', newCount);
          return newCount;
        });
      }
    }
    
    // Disparar evento customizado para atualização em tempo real
    // As páginas podem escutar este evento para atualizar seus dados
    window.dispatchEvent(
      new CustomEvent('notificationReceived', {
        detail: notification,
      })
    );
  }, []);

  // Conectar WebSocket
  useWebSocket({
    onNotification: handleNotification,
    enabled: isAuthenticated,
  });

  // Carregar notificações e contadores quando autenticado ou filtro mudar
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadCounts();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setMineCount(0);
      setLoading(false);
    }
  }, [isAuthenticated, filter, loadNotifications, loadCounts]);

  // Recarregar contadores periodicamente (a cada 30 segundos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadCounts]);

  // Marcar como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      // Verificar se é notificação específica
      const notification = notifications.find((n) => n.id === id);
      if (notification) {
        const generalTypes = ['sprint_created'];
        if (!generalTypes.includes(notification.tipo)) {
          setMineCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [notifications]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadCount(0);
      setMineCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.delete(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      // Atualizar contadores se necessário
      if (deleted && !deleted.lida) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        const generalTypes = ['sprint_created'];
        if (!generalTypes.includes(deleted.tipo)) {
          setMineCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, [notifications]);

  // Refresh
  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(), loadCounts()]);
  }, [loadNotifications, loadCounts]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        mineCount,
        loading,
        filter,
        setFilter,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}
