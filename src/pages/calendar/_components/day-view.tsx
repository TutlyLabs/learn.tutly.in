import { endOfDay, format, startOfDay } from "date-fns";

interface Event {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  link: string;
}

interface DayViewProps {
  selectedDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function DayView({ selectedDate, events, onEventClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const splitEventForDay = (event: Event, date: Date) => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();

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

  const getEventsForDay = () => {
    return events
      .filter(
        (event) =>
          event.startDate <= endOfDay(selectedDate) && event.endDate >= startOfDay(selectedDate)
      )
      .map((event) => splitEventForDay(event, selectedDate));
  };

  const dayEvents = getEventsForDay();

  return (
    <div className="h-full">
      <div className="text-2xl font-bold p-4 mb-4">{format(selectedDate, "EEEE, d MMMM yyyy")}</div>
      <div className="relative min-h-full">
        {hours.map((hour) => (
          <div key={hour} className="relative h-[60px]">
            <div className="absolute w-full border-t flex m-2">
              <div className="sticky left-0 -mt-2.5 w-[60px] text-sm text-muted-foreground">
                {`${hour % 12 || 12}:00`} {hour < 12 ? "AM" : "PM"}
              </div>
              <div className="flex-1 h-[60px] p-2 relative">
                <div className="flex flex-row gap-2">
                  {dayEvents.map((event, index) => {
                    return (
                      hour >= event.startDate.getHours() &&
                      hour <= event.endDate.getHours() && (
                        <div
                          key={index}
                          className="bg-primary text-white text-sm font-semibold p-2 rounded cursor-pointer ml-4"
                          onClick={() => onEventClick(event)}
                        >
                          {event.name}
                        </div>
                      )
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
