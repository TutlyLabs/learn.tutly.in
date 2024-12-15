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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Component from "./charts";

interface Assignment {
  id: string;
  title: string;
  submissions: any[];
  points: number;
}

interface Course {
  courseId: string | undefined;
  totalPoints: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  assignments: Assignment[];
}

interface StudentDashboardData {
  courses: Course[];
}

interface Props {
  data: StudentDashboardData;
  selectedCourse: string;
}

export function StudentCards({ data, selectedCourse }: Props) {
  const course = data.courses.find((c) => c.courseId === selectedCourse);

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
      acc[status]?.push({ ...assignment, status });
      return acc;
    },
    {} as Record<string, (Assignment & { status: string })[]>
  );

  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAssignments =
    selectedStatus === "All"
      ? Object.values(groupedAssignments || {}).flat()
      : groupedAssignments?.[selectedStatus] || [];

  const searchFilteredAssignments = filteredAssignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAssignments = course?.assignments.length || 0;
  const submittedCount = groupedAssignments?.["Submitted"]?.length || 0;
  const notEvaluatedCount = groupedAssignments?.["Not Evaluated"]?.length || 0;
  const notSubmittedCount = groupedAssignments?.["Not Submitted"]?.length || 0;

  const completionPercentage =
    course && course.assignmentsSubmitted && course.totalAssignments
      ? Math.round((course.assignmentsSubmitted / course.totalAssignments) * 100)
      : 0;

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 mb-10 md:gap-10">
        {[
          {
            imgSrc: "/score.png",
            alt: "score",
            value: course?.totalPoints || 0,
            label: "Total Points Earned",
          },
          {
            imgSrc: "/leaderboard.png",
            alt: "completion",
            value: `${completionPercentage}%`,
            label: "Course Completion",
          },
          {
            imgSrc: "/assignment.png",
            alt: "assignment",
            value: course?.assignmentsSubmitted || 0,
            label: "Assignments Submitted",
          },
        ].map((item, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-center w-full sm:w-80 rounded-md bg-white p-4 text-gray-900 shadow-xl"
          >
            <div className="h-20 w-20 flex items-center justify-center">
              <img src={item.imgSrc} alt={item.alt} className="w-20 h-20 object-contain" />
            </div>
            <div className="sm:ml-4 text-center">
              <p className="pt-3 text-2xl font-bold text-blue-600">{item.value}</p>
              <h1 className="p-1 text-sm font-bold text-gray-700">{item.label}</h1>
            </div>
          </div>
        ))}
      </div>

      <Card className="w-full mx-auto mb-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <div className="flex justify-center items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="py-1.5 px-8 text-sm font-medium border text-gray-400 border-gray-300 rounded-md">
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
            <Input
              type="text"
              placeholder="Search by assignment name"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchFilteredAssignments.map((assignment: any) => (
                  <TableRow key={assignment.id} className="cursor-pointer text-left">
                    <TableCell>
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
                    <TableCell className="hidden md:table-cell">{assignment.id}</TableCell>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>{assignment.submissions?.length || 0}</TableCell>
                    <TableCell>{assignment.points || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {Number(totalAssignments) > 0 && (
        <div className="flex justify-around mb-3 gap-3">
          <div className="flex-1">
            <Component
              notEvaluated={notEvaluatedCount}
              notSubmitted={notSubmittedCount}
              submitted={submittedCount}
            />
          </div>
          <Card className="flex-1 px-10">
            <div className="flex flex-col justify-center h-full">
              <div className="flex justify-between items-center mb-3 text-base font-medium dark:text-white">
                <h1>Successfully Completed and Evaluated</h1>
                <h1>
                  {submittedCount}/{totalAssignments}
                </h1>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${((submittedCount / totalAssignments) * 100).toFixed(2)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mb-3 text-base font-medium dark:text-white">
                <h1>Not Evaluated</h1>
                <h1>
                  {notEvaluatedCount}/{totalAssignments}
                </h1>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                <div
                  className="bg-yellow-600 h-2.5 rounded-full"
                  style={{ width: `${((notEvaluatedCount / totalAssignments) * 100).toFixed(2)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mb-3 text-base font-medium dark:text-white">
                <h1>Not Submitted</h1>
                <h1>
                  {notSubmittedCount}/{totalAssignments}
                </h1>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                <div
                  className="bg-red-600 h-2.5 rounded-full"
                  style={{ width: `${((notSubmittedCount / totalAssignments) * 100).toFixed(2)}%` }}
                ></div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
