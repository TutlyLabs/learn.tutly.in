import { useState } from "react";

import NoDataFound from "@/pages/courses/_components/NoDataFound";

import Accordion from "./accordion";

export default function CommunityForum({ allDoubts, currentUser }: any) {
  const [currentCourse, setCurrentCourse] = useState<string>(allDoubts[0]?.id);
  const filteredallDoubts = allDoubts.filter((x: any) => x.id === currentCourse);

  if (!currentUser) return <div className="text-center">Sign in to view doubts!</div>;

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 py-5 text-center text-2xl font-bold text-white sm:py-8 sm:text-4xl">
        Community Forum
      </h1>
      <div className="flex gap-3">
        {allDoubts?.map(
          (course: any) =>
            course.isPublished === true && (
              <button
                onClick={() => setCurrentCourse(course.id)}
                className={`w-20 rounded p-2 sm:w-auto ${
                  currentCourse === course?.id && "rounded border"
                }`}
                key={course?.id}
              >
                <h1 className="max-w-xs truncate text-sm font-medium">{course.title}</h1>
              </button>
            )
        )}
      </div>
      <div className="flex flex-col gap-2">
        {filteredallDoubts && (
          <Accordion
            currentCourseId={currentCourse}
            currentUser={currentUser}
            doubts={filteredallDoubts[0]?.doubts}
          />
        )}
      </div>
      <div>
        {filteredallDoubts[0].doubts.length === 0 && (
          <div className="flex w-full flex-col gap-4 mt-4">
            <NoDataFound message="No doubts found!" />
          </div>
        )}
      </div>
    </div>
  );
}
