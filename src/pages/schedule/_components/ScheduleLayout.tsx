import type { EventAttachment, ScheduleEvent } from "@prisma/client";
import { actions } from "astro:actions";
import { useState } from "react";

import EventDialog from "./EventDialog";
import MainContent from "./MainContent";
import Sidebar from "./Sidebar";

export type EventWithDetails = ScheduleEvent & {
  attachments: EventAttachment[];
  course: {
    id: string;
    title: string;
  } | null;
  haveAdminAccess: boolean;
};

interface ScheduleLayoutProps {
  initialEvents: EventWithDetails[];
  courses: { id: string; title: string }[];
  haveAdminAccess: boolean;
}

export default function ScheduleLayout({
  initialEvents,
  courses,
  haveAdminAccess,
}: ScheduleLayoutProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = async (date: string) => {
    setIsLoading(true);
    try {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const { data, error } = await actions.schedule_getSchedule({
        date: normalizedDate.toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      const eventsWithAccess = (data.events as EventWithDetails[]).map((event) => ({
        ...event,
        haveAdminAccess,
      }));

      setEvents(eventsWithAccess);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    handleDateChange(today.toISOString());
  };

  const handleEventSelect = (event: EventWithDetails) => {
    setSelectedEvent(event);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b pb-4 flex items-center gap-2 justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">View and manage your schedule</p>
        </div>
        {haveAdminAccess && <EventDialog courses={courses} onSuccess={refreshEvents} />}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 h-[70vh] overflow-auto">
          <Sidebar
            events={events}
            onEventSelect={handleEventSelect}
            isLoading={isLoading}
            onDateChange={handleDateChange}
            haveAdminAccess={haveAdminAccess}
          />
        </div>
        <div className="w-full md:w-2/3 h-[70vh] overflow-auto">
          <MainContent
            selectedEvent={selectedEvent}
            isLoading={isLoading}
            haveAdminAccess={haveAdminAccess}
          />
        </div>
      </div>
    </div>
  );
}
