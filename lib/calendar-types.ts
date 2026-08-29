export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

export type CalendarDayCell = {
  date: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalendarSyncResult = {
  events: CalendarEvent[];
  fetchedAt: string;
};
