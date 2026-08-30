import type { CalendarDayCell, CalendarEvent } from "@/lib/calendar-types";
import { eventsForDate } from "@/lib/calendar-storage";

type CalendarOverlayProps = {
  cells: CalendarDayCell[];
  events: CalendarEvent[];
  /** Year overview tints date boxes purple; monthly pages show event titles. */
  compact?: boolean;
  onDateNavigate?: (date: string) => void;
};

function uniqueCellsByDate(cells: CalendarDayCell[]) {
  const byDate = new Map<string, CalendarDayCell>();
  for (const cell of cells) {
    if (!byDate.has(cell.date)) byDate.set(cell.date, cell);
  }
  return [...byDate.values()];
}

export function CalendarOverlay({
  cells,
  events,
  compact = false,
  onDateNavigate,
}: CalendarOverlayProps) {
  if (!cells.length || !events.length) return null;

  if (compact) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        {uniqueCellsByDate(cells).map((cell) => {
          const dayEvents = eventsForDate(events, cell.date);
          if (!dayEvents.length) return null;

          const titles = dayEvents.map((event) => event.summary).join(", ");

          return (
            <button
              key={cell.date}
              type="button"
              className="calendar-event-day-highlight pointer-events-auto absolute"
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
              }}
              title={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} — ${titles}`}
              aria-label={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} on ${cell.date}. Open day page.`}
              onClick={(event) => {
                event.stopPropagation();
                onDateNavigate?.(cell.date);
              }}
            />
          );
        })}
      </div>
    );
  }

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
