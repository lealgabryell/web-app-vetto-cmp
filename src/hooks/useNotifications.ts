import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notifications';
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadNotifications();
      setUnreadCount(data.length);
    } catch {
      // Silently fail — badge count is non-critical
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Busca count inicial e atualiza a cada 60 segundos
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { notifications, unreadCount, isLoading, fetchAll, markAsRead, markAllAsRead };
}
