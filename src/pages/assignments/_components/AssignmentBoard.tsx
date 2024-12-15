import { useState } from "react";
import { MdOutlineSportsScore } from "react-icons/md";

import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useRouter } from "@/hooks/use-router";

export default function StudentWiseAssignments({ courses, assignments, userId }: any) {
  const [currentCourse, setCurrentCourse] = useState<string>(courses[0]?.id);
  const router = useRouter();
  const [filterOption, setFilterOption] = useState<string>("all");
  const pathname = router.pathname;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          {courses?.map((course: any) => (
            <Tabs
              onClick={() => setCurrentCourse(course.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium cursor-pointer transition-colors 
                ${
                  currentCourse === course.id
                    ? "bg-blue-500 text-white border border-blue-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
              `}
              key={course.id}
            >
              <h1 className="truncate">{course.title}</h1>
            </Tabs>
          ))}
        </div>
        <div className="flex space-x-2 text-sm font-medium">
          <Tabs
            className={`cursor-pointer px-4 py-2 transition-all rounded-md 
              ${filterOption === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
            `}
            onClick={() => setFilterOption("all")}
          >
            All
          </Tabs>
          <Tabs
            className={`cursor-pointer px-4 py-2 transition-all rounded-md 
              ${filterOption === "reviewed" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
            `}
            onClick={() => setFilterOption("reviewed")}
          >
            Reviewed
          </Tabs>
          <Tabs
            className={`cursor-pointer px-4 py-2 transition-all rounded-md 
              ${filterOption === "unreviewed" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
            `}
            onClick={() => setFilterOption("unreviewed")}
          >
            Unreviewed
          </Tabs>
          <Tabs
            className={`cursor-pointer px-4 py-2 transition-all rounded-md 
              ${filterOption === "not-submitted" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
            `}
            onClick={() => setFilterOption("not-submitted")}
          >
            Not Submitted
          </Tabs>
        </div>
      </div>
      {assignments.map((course: any) => {
        if (course.id !== currentCourse) return null;
        return course.classes.map((cls: any) =>
          cls.attachments
            .filter((x: any) => {
              if (filterOption === "all") {
                return true;
              } else if (filterOption === "not-submitted") {
                return x.submissions.length === 0;
              } else if (filterOption === "unreviewed") {
                return (
                  x.submissions.length > 0 && x.submissions.some((x: any) => x.points.length === 0)
                );
              } else if (filterOption === "reviewed") {
                return (
                  x.submissions.length > 0 && x.submissions.some((x: any) => x.points.length > 0)
                );
              }
              return true;
            })
            .map((assignment: any) => (
              <Card key={assignment.id} className="rounded-lg border p-1 md:p-4 mt-1">
                <div className="flex flex-wrap items-center justify-around p-2 md:justify-between md:p-0 md:px-4">
                  <div className="flex w-full flex-wrap items-center justify-between md:flex-row">
                    <div className="text-sm">
                      <h2 className="m-2 flex-1 font-medium">{assignment.title}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white md:gap-6">
                      {assignment.submissions.length === 0 ? (
                        <div className="flex gap-6 items-center">
                          <div className="rounded-full bg-red-600 px-4 py-2">Not submitted</div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignment.submissions.map((eachSubmission: any, index: number) => {
                            if (eachSubmission.points.length === 0) {
                              if (
                                (pathname.startsWith("/mentor/") ||
                                  pathname.startsWith("instructor/")) &&
                                eachSubmission.submissionLink
                              ) {
                                return (
                                  <div
                                    onClick={() => router.push(eachSubmission.submissionLink)}
                                    className="flex items-center gap-6"
                                    key={index}
                                  >
                                    <div className="rounded-full bg-yellow-600 px-4 py-2">
                                      Under review
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-6" key={index}>
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 px-4 py-2">
                                      <h1>Submitted</h1>
                                    </div>
                                  </div>
                                );
                              }
                            } else {
                              let total = 0;
                              eachSubmission.points.forEach((point: any) => {
                                total += point.score;
                              });
                              if (
                                (pathname.startsWith("/mentor/") ||
                                  pathname.startsWith("instructor/")) &&
                                eachSubmission.submissionLink
                              ) {
                                return (
                                  <div
                                    className="flex items-center gap-6"
                                    onClick={() => router.push(eachSubmission.submissionLink)}
                                    key={index}
                                  >
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 px-4 py-2">
                                      <h1>Score: {total}</h1>
                                      <MdOutlineSportsScore className="inline sm:h-5 sm:w-5" />
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-6" key={index}>
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 px-4 py-2">
                                      <h1>Submitted</h1>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          })}
                        </div>
                      )}
                      <button
                        title="Details"
                        onClick={() => {
                          if (userId) {
                            router.push(`/assignments/${assignment.id}?username=${userId}`);
                          } else {
                            router.push(`/assignments/${assignment.id}`);
                          }
                        }}
                        className="rounded bg-blue-500 px-4 py-2"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
        );
      })}
    </div>
  );
}
