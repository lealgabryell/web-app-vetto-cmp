'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Notification } from '../../types/notifications';
import { NotificationItem } from './NotificationItem';

interface Props {
  notifications: Notification[];
  isLoading: boolean;
  onRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  onRead,
  onMarkAllAsRead,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const unread = notifications.filter((n) => !n.read);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">
          Notificações
          {unread.length > 0 && (
            <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {unread.length} não {unread.length === 1 ? 'lida' : 'lidas'}
            </span>
          )}
        </h3>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Nenhuma notificação por aqui
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
