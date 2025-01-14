"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DayView } from "./day-view";
import { EventDetails } from "./event-details";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { YearView } from "./year-view";

type ViewType = "day" | "week" | "month" | "year";

interface Event {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  link: string;
}

export function Calendar({ events }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const navigateToday = () => setSelectedDate(new Date());

  const navigate = (direction: "prev" | "next") => {
    if (view === "day") {
      setSelectedDate(direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
    } else if (view === "week") {
      setSelectedDate(direction === "prev" ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1));
    } else if (view === "month") {
      setSelectedDate(
        direction === "prev" ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1)
      );
    } else if (view === "year") {
      setSelectedDate(direction === "prev" ? subYears(selectedDate, 1) : addYears(selectedDate, 1));
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="flex flex-col">
      <header className="flex md:flex-row flex-col gap-5  items-center justify-between p-2 border-b">
        <div className="flex items-center space-x-4">
          <Tabs value={view} onValueChange={(value) => setView(value as ViewType)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-lg font-semibold">{format(selectedDate, "dd MMMM yyyy")}</span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {view === "day" && (
          <DayView selectedDate={selectedDate} events={events} onEventClick={handleEventClick} />
        )}
        {view === "week" && (
          <WeekView selectedDate={selectedDate} events={events} onEventClick={handleEventClick} />
        )}
        {view === "month" && (
          <MonthView selectedDate={selectedDate} events={events} onEventClick={handleEventClick} />
        )}
        {view === "year" && (
          <YearView selectedDate={selectedDate} events={events} onEventClick={handleEventClick} />
        )}
      </main>

      {selectedEvent && (
        <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
