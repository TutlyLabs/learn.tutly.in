"use client";

import { format } from "date-fns";
import { BarChart, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StreamAnalyticsModalProps {
  analytics: any;
  roomName: string;
  children?: React.ReactNode;
}

export function StreamAnalyticsModal({ analytics, roomName, children }: StreamAnalyticsModalProps) {
  if (!analytics) return null;

  const streamDuration = Date.now() - new Date(analytics.streamStartTime).getTime();
  const durationInMinutes = Math.floor(streamDuration / 1000 / 60);

  const chartData = analytics.userCountTimeline.map((point: any) => ({
    time: format(new Date(point.timestamp), "HH:mm"),
    users: point.count,
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
            <BarChart className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <BarChart className="h-5 w-5" />
            Stream Analytics - {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{durationInMinutes} min</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Peak Viewers</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.peakConcurrentUsers}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.totalMessages}</p>
          </div>
        </div>

        <div className="mt-8 bg-card p-4 rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground mb-4">Viewer Count</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-muted-foreground mb-4">Participants</p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Minutes Watched</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Join Time</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(analytics.participants).map((participant: any) => (
                  <TableRow key={participant.identity}>
                    <TableCell className="font-medium">{participant.identity}</TableCell>
                    <TableCell>{Math.round(participant.minutesWatched)}</TableCell>
                    <TableCell>{participant.sessions.length}</TableCell>
                    <TableCell>{format(new Date(participant.joinTime), "hh:mm a")}</TableCell>
                    <TableCell>{format(new Date(participant.lastSeenAt), "hh:mm a")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {participant.audioEnabled && (
                          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-700">
                            Audio
                          </span>
                        )}
                        {participant.videoEnabled && (
                          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-700">
                            Video{" "}
                            {participant.connectionQuality && `(${participant.connectionQuality})`}
                          </span>
                        )}
                        {participant.hasScreenShared && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-700">
                            Shared Screen
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
