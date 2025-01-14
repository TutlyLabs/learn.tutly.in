import { addMonths, format, startOfYear } from "date-fns";

import { MonthCalendar } from "./month-calendar";

interface Event {
  type: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  link: string;
}

interface YearViewProps {
  selectedDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function YearView({ selectedDate, events, onEventClick }: YearViewProps) {
  const yearStart = startOfYear(selectedDate);
  const today = new Date();

  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10 p-4 mb-10">
      {months.map((month) => (
        <MonthCalendar
          key={format(month, "MM-yyyy")}
          month={month}
          today={today}
          selectedDate={selectedDate}
          events={events}
          onEventClick={onEventClick}
          compact
        />
      ))}
    </div>
  );
}
