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
        const dayEvents = eventsForDate(events, cell.date).slice(0, 3);
        if (!dayEvents.length) return null;

        return (
          <div
            key={`${cell.date}-${index}`}
            className="absolute flex flex-col items-center justify-center gap-px overflow-hidden px-0.5"
            style={{
              left: `${cell.x}%`,
              top: `${cell.y + 3}%`,
              width: `${cell.width}%`,
              height: `${Math.max(cell.height - 2, 6)}%`,
            }}
          >
            {dayEvents.map((event) => (
              <div
                key={`${cell.date}-${event.id}`}
                className="calendar-event w-full truncate rounded-sm px-0.5 py-px text-center text-[7px] leading-tight font-semibold sm:text-[8px]"
                title={`${event.summary} — ${cell.date}`}
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
