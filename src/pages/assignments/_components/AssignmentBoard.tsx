import { useState } from "react";
import { MdOutlineSportsScore } from "react-icons/md";

import { useRouter } from "@/hooks/use-router";

export default function StudentWiseAssignments({ courses, assignments, userId }: any) {
  const [currentCourse, setCurrentCourse] = useState<string>(courses[0]?.id);
  const router = useRouter();
  const [filterOption, setFilterOption] = useState<string>("all");
  const pathname = router.pathname;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {courses?.map((course: any) => (
            <button
              onClick={() => setCurrentCourse(course.id)}
              className={`rounded p-2 sm:w-auto ${currentCourse === course.id && "rounded border"}`}
              key={course.id}
            >
              <h1 className="max-w-xs truncate text-sm font-medium">{course.title}</h1>
            </button>
          ))}
        </div>
        <div className="m-auto space-x-4 text-sm font-medium sm:m-0">
          <button
            className={`cursor-pointer focus:outline-none ${
              filterOption === "all" && "border-b-2"
            } `}
            onClick={() => setFilterOption("all")}
          >
            <label>All</label>
          </button>
          <button
            className={`cursor-pointer focus:outline-none ${
              filterOption === "reviewed" && "border-b-2"
            } `}
            onClick={() => setFilterOption("reviewed")}
          >
            <label>Reviewed</label>
          </button>
          <button
            className={`cursor-pointer focus:outline-none ${
              filterOption === "unreviewed" && "border-b-2"
            } `}
            onClick={() => setFilterOption("unreviewed")}
          >
            <label>Unreviewed</label>
          </button>
          <button
            className={`cursor-pointer focus:outline-none ${
              filterOption === "not-submitted" && "border-b-2"
            } `}
            onClick={() => setFilterOption("not-submitted")}
          >
            <label>Not Submitted</label>
          </button>
        </div>
      </div>
      {assignments.map((course: any) => {
        if (course.id !== currentCourse) return null;
        return course.classes.map((cls: any) =>
          cls.attachments
            .filter((x: any) => {
              if (filterOption == "all") {
                return true;
              } else if (filterOption == "not-submitted") {
                return x.submissions.length === 0;
              } else if (filterOption == "unreviewed") {
                return (
                  x.submissions.length > 0 && x.submissions.some((x: any) => x.points.length === 0)
                );
              } else if (filterOption == "reviewed") {
                return (
                  x.submissions.length > 0 && x.submissions.some((x: any) => x.points.length > 0)
                );
              }
              return true;
            })
            .map((assignment: any) => (
              <div key={assignment.id} className="rounded-lg border p-1 md:p-3">
                <div className="flex flex-wrap items-center justify-around p-2 md:justify-between md:p-0 md:px-4">
                  <div className="flex w-full flex-wrap items-center justify-between md:flex-row">
                    <div className="text-sm">
                      <h2 className="m-2 flex-1 font-medium">{assignment.title}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white md:gap-6">
                      {assignment.submissions.length === 0 ? (
                        <div className="itens-center flex gap-6">
                          <div className="rounded-full bg-secondary-600 p-2.5">Not submitted</div>
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
                                    <div className="rounded-full bg-yellow-600 p-2.5">
                                      Under review
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-6" key={index}>
                                    {/* <div className="rounded-full p-2.5 bg-yellow-600">
                                        Under review
                                      </div> */}
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 p-2.5">
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
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 p-2.5">
                                      <h1>Score: {total}</h1>
                                      <MdOutlineSportsScore className="inline sm:h-5 sm:w-5" />
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-6" key={index}>
                                    {/* <div className="rounded-full p-2.5 bg-green-600 flex items-center">
                                        <h1>Score: {total}</h1>
                                        <MdOutlineSportsScore className="inline sm:h-5 sm:w-5" />
                                      </div> */}
                                    <div className="flex cursor-pointer items-center rounded-full bg-green-600 p-2.5">
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
                        className="rounded bg-blue-500 p-2.5"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        );
      })}
    </div>
  );
}
