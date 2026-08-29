export type CalendarEvent = {
  id: string;
  summary: string;
  /** Local calendar date YYYY-MM-DD when the event starts */
  startDate: string;
  /** For all-day events: exclusive end date YYYY-MM-DD */
  endDate: string;
  allDay: boolean;
  start: string;
  end: string;
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
