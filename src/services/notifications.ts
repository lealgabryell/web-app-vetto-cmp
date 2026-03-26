import { api } from './api';
import { CreateNotificationRequest, Notification } from '../types/notifications';

export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get<Notification[]>('/api/notifications/unread');
  return data;
};

export const getAllNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get<Notification[]>('/api/notifications');
  return data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.patch(`/api/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/api/notifications/read-all');
};

export const createNotification = async (
  payload: CreateNotificationRequest,
): Promise<void> => {
  await api.post('/api/notifications', payload);
};
