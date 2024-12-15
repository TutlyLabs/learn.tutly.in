import { EventAttachmentType } from "@prisma/client";
import dayjs from "dayjs";
import { ArrowUpRight, CalendarIcon, Link, Video, VideoIcon, Youtube } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import AttachmentDialog from "./AttachmentDialog";
import type { EventWithDetails } from "./ScheduleLayout";

interface MainContentProps {
  selectedEvent: EventWithDetails | null;
  isLoading?: boolean;
  haveAdminAccess: boolean;
}

export default function MainContent({
  selectedEvent,
  isLoading = false,
  haveAdminAccess,
}: MainContentProps) {
  const onSuccess = () => {
    window.location.reload();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!selectedEvent) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <CalendarIcon className="w-12 h-12 mx-auto opacity-20" />
          <p className="text-base">Select an event to view attachments</p>
        </div>
      </div>
    );
  }

  const getAttachmentIcon = (type: EventAttachmentType) => {
    switch (type) {
      case "YOUTUBE":
      case "YOUTUBE_LIVE":
        return <Youtube className="h-5 w-5" />;
      case "VIMEO":
        return <Video className="h-5 w-5" />;
      case "GMEET":
      case "JIOMEET":
        return <VideoIcon className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b pb-4 sticky top-0 bg-background/95 backdrop-blur z-10 px-6 pt-3">
        <h2 className="text-2xl font-bold tracking-tight">{selectedEvent.title}</h2>
        <div className="text-muted-foreground mt-1 text-base space-y-1">
          <p>Start: {dayjs(selectedEvent.startTime).format("MMMM D, YYYY [at] HH:mm")}</p>
          <p>End: {dayjs(selectedEvent.endTime).format("MMMM D, YYYY [at] HH:mm")}</p>
        </div>
        {haveAdminAccess && (
          <div className="mt-2">
            <AttachmentDialog eventId={selectedEvent.id} onSuccess={onSuccess} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        {selectedEvent.attachments.map((attachment) => (
          <Card
            key={attachment.id}
            className="group hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
          >
            <CardHeader className="flex flex-row items-center gap-3 py-3">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                {getAttachmentIcon(attachment.type)}
              </div>
              <CardTitle className="text-lg">{attachment.title}</CardTitle>
            </CardHeader>
            {attachment.link && (
              <CardContent className="py-2">
                <a
                  href={attachment.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline text-base font-medium"
                >
                  Open {attachment.type.toLowerCase()}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full w-full p-4">
      <div className="border-b pb-4 mb-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center gap-3 py-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="py-2">
                <Skeleton className="h-5 w-28" />
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
