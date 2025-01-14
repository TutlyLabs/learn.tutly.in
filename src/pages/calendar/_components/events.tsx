"use client";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { CiStreamOn } from "react-icons/ci";
import { MdEventRepeat } from "react-icons/md";
import { PiTagChevronBold } from "react-icons/pi";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

dayjs.extend(isBetween);

export function EventsSidebar({ events }: { events: any[] }) {
  const getStatusBadge = (startDate: string, endDate: string, type: string) => {
    const now = dayjs();
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (type === "Holiday" || type === "Assignment") {
      return (
        <span className="ml-auto text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
          {type}
        </span>
      );
    }
    if (now.isBetween(start, end, null, "[]")) {
      return (
        <span className="flex justify-center gap-1 ml-auto text-xs font-medium text-purple-500 bg-purple-100 px-3 py-1.5 rounded-full">
          <CiStreamOn className="text-base font-bold " /> Live
        </span>
      );
    }
    if (end.isBefore(now)) {
      return (
        <span className="ml-auto text-xs font-medium text-red-500 bg-red-100 px-3 py-1.5 rounded-full">
          Completed
        </span>
      );
    } else {
      return (
        <span className="ml-auto text-xs font-medium text-green-800 bg-green-100 px-3 py-1.5 rounded-full">
          Upcoming
        </span>
      );
    }
  };

  const renderEventItem = (event: any) => (
    <div
      key={event.id}
      className="flex items-center p-3 gap-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <PiTagChevronBold className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      <div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{event.name}</h1>
      </div>
      {getStatusBadge(event.startDate, event.endDate, event.type)}
    </div>
  );

  const renderAssignmentItem = (assignment: any) => (
    <div
      key={assignment.id}
      className="flex items-center p-3 gap-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {assignment.name}
        </h1>
      </div>
      {getStatusBadge(assignment.startDate, assignment.endDate, assignment.type)}
    </div>
  );

  const now = dayjs();
  const assignments = events?.filter((event) => event.type === "Assignment");
  const otherEvents = events?.filter((event) => event.type !== "Assignment");

  // live events
  const liveEvents = otherEvents?.filter((event) =>
    now.isBetween(dayjs(event.startDate), dayjs(event.endDate), null, "[]")
  );

  // upcoming events
  const upcomingEvents = otherEvents?.filter((event) => dayjs(event.startDate).isAfter(now));

  // completed events
  const completedEvents = otherEvents?.filter((event) => dayjs(event.endDate).isBefore(now));

  const renderEventSection = (title: string, eventList: any[], emptyMessage: string) => (
    <>
      <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 p-2">{title}</h2>
      {eventList.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 my-5">
          <MdEventRepeat className="h-12 w-12 md:h-16 md:w-16 text-gray-300 dark:text-gray-500" />
          <p className="text-sm mt-4">{emptyMessage}</p>
        </div>
      ) : (
        eventList.map(renderEventItem)
      )}
    </>
  );

  const renderAssignmentSection = (assignments: any[]) => (
    <>
      <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 p-2">Assignments</h2>
      {assignments.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 my-5">
          <MdEventRepeat className="h-12 w-12 md:h-16 md:w-16 text-gray-300 dark:text-gray-500" />
          <p className="text-sm mt-4">No assignments available</p>
        </div>
      ) : (
        assignments.map(renderAssignmentItem)
      )}
    </>
  );

  return (
    <div>
      <ScrollArea className="md:h-[570px] overflow-auto">
        <Card className="w-full md:w-[290px] bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
          {renderEventSection("Live Events", liveEvents, "No live events")}
          {renderEventSection("Upcoming Events", upcomingEvents, "No upcoming events")}
          {renderEventSection("Completed Events", completedEvents, "No completed events")}
          {renderAssignmentSection(assignments)}
        </Card>
      </ScrollArea>
    </div>
  );
}
