import { useState } from "react";

import { Tabs } from "@/components/ui/tabs";

// import Accordion from "./accordion";
import Messages from "./messages";

export default function Community({ allDoubts, currentUser }: any) {
  const [currentCourse, setCurrentCourse] = useState<string>(allDoubts[0]?.id);
  const filteredallDoubts = allDoubts.filter((x: any) => x.id === currentCourse);

  if (!currentUser) return <div className="text-center">Sign in to view doubts!</div>;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {allDoubts?.map(
          (course: any) =>
            course.isPublished && (
              <Tabs
                onClick={() => setCurrentCourse(course.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                  currentCourse === course.id
                    ? "bg-blue-600 text-white border border-blue-700 shadow-lg"
                    : "bg-white text-gray-800 border border-gray-300 hover:bg-blue-50 hover:shadow-md"
                }`}
                key={course?.id}
              >
                <h1 className="max-w-xs truncate text-sm font-semibold">{course.title}</h1>
              </Tabs>
            )
        )}
      </div>
      <div className="flex flex-col gap-2">
        {filteredallDoubts && (
          <Messages
            currentCourseId={currentCourse}
            currentUser={currentUser}
            doubts={filteredallDoubts[0]?.doubts}
          />
        )}
      </div>
      <div>
        {filteredallDoubts[0].doubts.length === 0 && (
          <div className="text-center text-lg font-semibold mt-4">
            <h1>"Be the first to start a discussion and get the prestige!"</h1>
          </div>
        )}
      </div>
    </div>
  );
}
