export type MeetingStatus = 'EM_ANALISE' | 'CONFIRMADO' | 'CANCELADO' | 'RECUSADO';

export interface Meeting {
  id: string;
  title: string;
  startTime: string; // ISO string para facilitar o uso com date-fns/dayjs
  endTime: string;
  status: MeetingStatus;
  adminId: string;
  clientId: string;
}

export interface MeetingResponse {
  id: string; 
  title: string;
  startTime: string; 
  endTime: string;
  status: MeetingStatus;
  adminId: string;
  adminName: string;
  clientId: string;
  clientName: string;
  myNote: string | null;
}

export interface CreateMeetingRequest {
  title: string;
  startTime: string;
  endTime: string;
  adminId: string;
  clientId: string;
}

export interface UpdateNoteRequest {
  content: string;
}