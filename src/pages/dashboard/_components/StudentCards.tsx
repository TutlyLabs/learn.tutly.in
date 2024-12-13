"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentDashboardData } from "@/types/dashboard";

interface Props {
  data: StudentDashboardData;
  selectedCourse: string;
}

export function StudentCards({ data, selectedCourse }: Props) {
  const course = data.courses.find((c) => c.courseId === selectedCourse);
  const completionPercentage = course
    ? Math.round((course.assignmentsSubmitted / course.totalAssignments) * 100)
    : 0;

  const groupedAssignments = course?.assignments?.reduce(
    (acc, assignment) => {
      const submissionsCount = assignment.submissions?.length || 0;
      const points = Number(assignment.points) || 0;

      let status = "Unknown";
      if (submissionsCount > 0 && points > 0) {
        status = "Submitted";
      } else if (submissionsCount > 0 && points === 0) {
        status = "Not Evaluated";
      } else if (submissionsCount === 0 && points === 0) {
        status = "Not Submitted";
      }

      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push({ ...assignment, status });
      return acc;
    },
    {} as Record<string, (typeof course)["assignments"]>
  );

  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const filteredAssignments =
    selectedStatus === "All"
      ? Object.entries(groupedAssignments || {}).flatMap(([_, assignments]) => assignments)
      : groupedAssignments[selectedStatus] || [];

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        <div className="w-80 rounded-md bg-white p-4 text-gray-900 shadow-xl">
          <div className="m-auto h-24 w-24 flex items-center justify-center">
            <img src="/score.png" alt="pencil" className="w-20 h-20 object-contain" />
          </div>
          <p className="pt-3 text-2xl font-bold text-blue-600">{course?.totalPoints || 0}</p>
          <h1 className="p-1 text-sm font-bold text-gray-700">Total Points Earned</h1>
        </div>
        <div className="w-80 rounded-md bg-white p-4 text-gray-900 shadow-xl">
          <div className="m-auto h-24 w-24 flex items-center justify-center">
            <img src="/leaderboard.png" alt="completion" className="w-20 h-20 object-contain" />
          </div>
          <p className="pt-3 text-2xl font-bold text-blue-600">{completionPercentage}%</p>
          <h1 className="p-1 text-sm font-bold text-gray-700">Course Completion</h1>
        </div>
        <div className="w-80 rounded-md bg-white p-4 text-gray-900 shadow-xl">
          <div className="m-auto h-24 w-24 flex items-center justify-center">
            <img src="/assignment.png" alt="assignment" className="w-20 h-20 object-contain" />
          </div>
          <p className="pt-3 text-2xl font-bold text-blue-600">
            {course?.assignmentsSubmitted || 0}
          </p>
          <h1 className="p-1 text-sm font-bold text-gray-700">Assignments Submitted</h1>
        </div>
      </div>
      <Card className="w-1/2 mb-10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="py-1.5 px-8 text-sm font-semibold outline-none rounded-md text-gray-900 bg-slate-50">
                {selectedStatus}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedStatus("All")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Submitted")}>
                Submitted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Not Submitted")}>
                Not Submitted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Not Evaluated")}>
                Not Evaluated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow className="p-4">
                  <TableHead className="p-4">Status</TableHead>
                  {/* <TableHead>ID</TableHead> */}
                  <TableHead className="p-4">Title</TableHead>
                  <TableHead className="p-4">Submissions</TableHead>
                  <TableHead className="p-4">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment: any) => (
                  <TableRow key={assignment.id} className="text-left">
                    <TableCell className="p-4">
                      <Badge
                        variant={
                          assignment.status === "Submitted"
                            ? "default"
                            : assignment.status === "Not Evaluated"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    {/* <TableCell>{assignment.id}</TableCell> */}
                    <TableCell className="p-4">{assignment.title}</TableCell>
                    <TableCell className="p-4">{assignment.submissions?.length || 0}</TableCell>
                    <TableCell className="p-4">{assignment.points || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
