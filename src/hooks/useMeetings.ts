import { isSameDay, parseISO } from 'date-fns';
import { MeetingResponse } from '../types/scheduling';

export const getDayStatus = (date: Date, meetings: MeetingResponse[]) => {
  const count = meetings.filter(m => isSameDay(parseISO(m.startTime), date)).length;

  if (count === 0) return 'available'; // Verde
  if (count >= 1 && count <= 2) return 'busy'; // Cinza
  return 'full'; // Vermelho
};