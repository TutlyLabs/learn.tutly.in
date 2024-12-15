import dayjs from "dayjs";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "@/hooks/use-search-params";
import { cn } from "@/lib/utils";

import type { EventWithDetails } from "./ScheduleLayout";

interface SidebarProps {
  events: EventWithDetails[];
  onEventSelect: (event: EventWithDetails) => void;
  isLoading?: boolean;
  onDateChange: (date: string) => void;
  haveAdminAccess: boolean;
}

export default function Sidebar({
  events,
  onEventSelect,
  onDateChange,
  isLoading = false,
}: SidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get("date")
    ? dayjs(searchParams.get("date")).toDate()
    : new Date();

  const filteredEvents = events.filter(
    (event) =>
      dayjs(event.startTime).format("YYYY-MM-DD") === dayjs(selectedDate).format("YYYY-MM-DD")
  );

  const handlePrevDay = () => {
    const newDate = dayjs(selectedDate).subtract(1, "day");
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("date", newDate.format("YYYY-MM-DD"));
      return newParams;
    });
    onDateChange(newDate.toISOString());
  };

  const handleNextDay = () => {
    const newDate = dayjs(selectedDate).add(1, "day");
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("date", newDate.format("YYYY-MM-DD"));
      return newParams;
    });
    onDateChange(newDate.toISOString());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("date", dayjs(date).format("YYYY-MM-DD"));
        return newParams;
      });
      onDateChange(dayjs(date).toISOString());
    }
  };

  return (
    <div className="space-y-6 p-4 rounded-lg shadow-sm border bg-background">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevDay}
          className="hover:bg-muted-foreground/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dayjs(selectedDate).format("MMMM D, YYYY")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextDay}
          className="hover:bg-muted-foreground/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-3 h-[50vh]">
        <h3 className="font-medium text-muted-foreground text-sm ml-1">
          {isLoading ? "Loading..." : `${filteredEvents.length} Events Today`}
        </h3>

        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <>
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-muted/50 group"
                onClick={() => onEventSelect(event)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium group-hover:text-primary">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {dayjs(event.startTime).format("HH:mm")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Paperclip className="h-4 w-4" />
                      {event.attachments.length}{" "}
                      {event.attachments.length === 1 ? "attachment" : "attachments"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No events scheduled for this date
          </div>
        )}
      </div>
    </div>
  );
}
