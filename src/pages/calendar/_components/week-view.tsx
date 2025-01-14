"use client";

import { addDays, endOfDay, format, isSameDay, startOfDay, startOfWeek } from "date-fns";

interface Event {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  link: string;
}
interface WeekViewProps {
  selectedDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function WeekView({ selectedDate, events, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();

  const splitEventForDay = (event: Event, day: Date) => {
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();

    const eventStart = event.startDate.getTime();
    const eventEnd = event.endDate.getTime();

    const segmentStart = new Date(Math.max(dayStart, eventStart));
    const segmentEnd = new Date(Math.min(dayEnd, eventEnd));

    return {
      ...event,
      startDate: segmentStart,
      endDate: segmentEnd,
    };
  };

  const getEventsForDay = (day: Date) => {
    return events
      .filter((event) => event.startDate <= endOfDay(day) && event.endDate >= startOfDay(day))
      .map((event) => splitEventForDay(event, day));
  };

  const getEventsLayout = (dayEvents: Event[]) => {
    const columns: Event[][] = [];

    dayEvents.forEach((event) => {
      let placed = false;
      for (const column of columns) {
        if (!column.some((e) => e.endDate > event.startDate)) {
          column.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
      }
    });

    return dayEvents.map((event) => {
      const columnIndex = columns.findIndex((column) => column.includes(event));
      const totalColumns = columns.length;
      return {
        left: (columnIndex / totalColumns) * 100,
        width: 100 / totalColumns,
      };
    });
  };

  const getEventStyle = (event: Event, layout: { left: number; width: number }) => {
    const startMinutes = event.startDate.getHours() * 60 + event.startDate.getMinutes();
    const endMinutes = event.endDate.getHours() * 60 + event.endDate.getMinutes();
    const duration = endMinutes - startMinutes;

    return {
      top: `${startMinutes}px`,
      height: `${duration}px`,
      backgroundColor: "#3b82f6",
      left: `${layout.left}%`,
      width: `${layout.width}%`,
      position: "absolute" as const,
    };
  };

  return (
    <div className="h-full overflow-auto">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
          <div className="h-12"></div>
          <div className="grid grid-cols-7 divide-x divide-border">
            {days.map((day) => (
              <div
                key={day.toString()}
                className={`text-center p-3 ${
                  isSameDay(day, today) ? "bg-green-600 text-primary-foreground" : ""
                }`}
              >
                <div className="text-sm font-medium">{format(day, "EEE")}</div>
                <div className="text-sm font-bold">{format(day, "d")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
        <div className="divide-y divide-border">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex items-center justify-end pr-2 h-[60px] text-sm text-muted-foreground"
            >
              {format(new Date().setHours(hour, 0, 0, 0), "h a")}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-border">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const layouts = getEventsLayout(dayEvents);

            return (
              <div key={day.toString()} className="relative divide-y divide-border">
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px]"></div>
                ))}
                {dayEvents.map((event, index) => {
                  const layout = layouts[index];
                  if (!layout) return null;

                  return (
                    <div
                      key={`${event.name}-${event.startDate.getTime()}`}
                      className="text-xs font-semibold rounded cursor-pointer text-primary-foreground break-words whitespace-normal p-2"
                      style={getEventStyle(event, layout)}
                      onClick={() => onEventClick(event)}
                    >
                      <h1>{event.name}</h1>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
