export type NotificationType =
  | 'ATRIBUIDO_RESPONSAVEL'
  | 'ATRIBUIDO_APROVADOR'
  | 'ETAPA_APROVADA'
  | 'ETAPA_TOTALMENTE_APROVADA'
  | 'APROVACAO_SOLICITADA';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  contractId: string;
  contractStepId: string;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationRequest {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  contractId: string;
  contractStepId: string;
}
