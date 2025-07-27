"use client";

import { Attachment } from "@prisma/client";
import { Calendar, RefreshCw } from "lucide-react";

import MarkdownPreview from "@/components/MarkdownPreview";
import { Badge } from "@/components/ui/badge";
import day from "@/lib/dayjs";

interface AssignmentPreviewProps {
  assignment: Attachment;
}

export function AssignmentPreview({ assignment }: AssignmentPreviewProps) {
  return (
    <div
      className="w-full backdrop-blur-xl flex flex-col h-full rounded-l-xl shadow-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(15, 15, 15, 1) 0%, rgba(35, 35, 35, 1) 10%, rgba(25, 25, 25, 1) 50%, rgba(20, 20, 20, 1) 100%)",
        borderColor: "rgba(100, 100, 100, 0.2)",
      }}
    >
      {/* Header */}
      <div
        className="backdrop-blur-xl border-b flex items-center justify-between px-4 py-2 flex-shrink-0 h-[43px]"
        style={{
          borderColor: "rgba(60, 60, 60, 0.18)",
          background:
            "linear-gradient(to right, rgba(20,20,20,0.95) 0%, rgba(25,25,25,0.98) 40%, rgba(10,10,10,1) 100%)",
        }}
      >
        <div className="text-lg font-semibold flex items-center" style={{ color: "#ffffff" }}>
          <span
            className="w-2 h-2 rounded-full mr-2"
            style={{
              backgroundColor: "#10b981",
              boxShadow: "0 0 4px rgba(16, 185, 129, 0.5)",
            }}
          ></span>
          {assignment.title}
        </div>

        {/* Compact chips */}
        <div className="flex items-center gap-2">
          {assignment.dueDate && (
            <Badge
              variant="secondary"
              className="bg-blue-900/50 text-blue-200 border-blue-700/50 text-xs px-2 py-1"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {day(assignment.dueDate).format("DD MMM YYYY")}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="bg-green-900/50 text-green-200 border-green-700/50 text-xs px-2 py-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {assignment.maxSubmissions} max submission
          </Badge>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="flex-1 overflow-y-auto p-1">
        <div
          className="rounded-lg border p-4 h-full"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderColor: "rgba(100, 100, 100, 0.2)",
          }}
        >
          {assignment.details ? (
            <MarkdownPreview
              content={assignment.details}
              className="text-white"
              fontSize="text-sm"
            />
          ) : (
            <div className="text-gray-400 text-center py-8">No assignment details provided</div>
          )}
        </div>
      </div>
    </div>
  );
}
