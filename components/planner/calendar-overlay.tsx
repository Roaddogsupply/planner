import type { CalendarDayCell, CalendarEvent } from "@/lib/calendar-types";
import { eventsForDate } from "@/lib/calendar-storage";

type CalendarOverlayProps = {
  cells: CalendarDayCell[];
  events: CalendarEvent[];
};

export function CalendarOverlay({ cells, events }: CalendarOverlayProps) {
  if (!cells.length || !events.length) return null;

  return (
    <>
      {cells.map((cell) => {
        const dayEvents = eventsForDate(events, cell.date).slice(0, 3);
        if (!dayEvents.length) return null;

        return (
          <div
            key={cell.date}
            className="pointer-events-none absolute overflow-hidden"
            style={{
              left: `${cell.x}%`,
              top: `${cell.y + 2.2}%`,
              width: `${Math.max(cell.width, 6)}%`,
              height: `${Math.max(cell.height, 4.5)}%`,
            }}
          >
            {dayEvents.map((event) => (
              <div
                key={`${cell.date}-${event.id}`}
                className="calendar-event mb-0.5 truncate rounded px-0.5 text-[9px] leading-tight font-medium sm:text-[10px]"
                title={event.summary}
              >
                {event.summary}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
