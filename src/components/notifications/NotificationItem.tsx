'use client';

import { Notification } from '../../types/notifications';

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}

export function NotificationItem({ notification, onRead, onClose }: Props) {
  const handleClick = async () => {
    if (!notification.read) {
      await onRead(notification.id);
    }
    onClose();
    window.dispatchEvent(
      new CustomEvent('open-step-modal', {
        detail: {
          contractId: notification.contractId,
          contractStepId: notification.contractStepId,
        },
      })
    );
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors ${
        !notification.read ? 'bg-blue-50' : 'opacity-70'
      }`}
    >
      <div className="flex items-start gap-2">
        {!notification.read && (
          <span className="mt-1.5 flex-shrink-0 inline-block w-2 h-2 bg-blue-500 rounded-full" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
