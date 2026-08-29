import type { CalendarDayCell, CalendarEvent } from "@/lib/calendar-types";
import { eventsForDate } from "@/lib/calendar-storage";

type CalendarOverlayProps = {
  cells: CalendarDayCell[];
  events: CalendarEvent[];
};

export function CalendarOverlay({ cells, events }: CalendarOverlayProps) {
  if (!cells.length || !events.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {cells.map((cell, index) => {
        const dayEvents = eventsForDate(events, cell.date).slice(0, 4);
        if (!dayEvents.length) return null;

        return (
          <div
            key={`${cell.date}-${index}`}
            className="absolute flex flex-col justify-start overflow-hidden"
            style={{
              left: `${cell.x}%`,
              top: `${cell.y + 2.5}%`,
              width: `${cell.width}%`,
              height: `${cell.height - 1}%`,
            }}
          >
            {dayEvents.map((event) => (
              <div
                key={`${cell.date}-${event.id}`}
                className="calendar-event mb-px truncate rounded-sm px-0.5 py-px text-[8px] leading-tight font-semibold sm:text-[9px]"
                title={`${event.summary} (${cell.date})`}
              >
                {event.summary}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
