"use client";

import { api } from "~/trpc/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import ClassSidebar from "./classes/_components/classSidebar";
import { useSession } from "next-auth/react";

export default function CourseDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { data: session } = useSession();

  const { data: course, isLoading: courseLoading } = api.courses.getById.useQuery({
    id: params.id
  });

  const { data: classesWithFolders, isLoading: classesLoading } = api.courses.getClassesWithFolders.useQuery({
    courseId: params.id
  });

  if (courseLoading || classesLoading || !session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-start w-full">
      <ClassSidebar
        courseId={params.id}
        classes={classesWithFolders ?? []}
        title="Assignments"
        currentUser={session.user}
        isCourseAdmin={session.user.role === "INSTRUCTOR"}
      />
      <div className="m-3 w-full">
        <h1 className="border-b-2 p-2 text-center text-lg font-medium md:text-xl">
          Assignments
        </h1>

        <div className="mt-3 grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 md:grid-cols-3">
          {course?.classes.length === 0 && (
            <div className="mt-5 text-xl dark:text-secondary-300">
              No assignments yet...
            </div>
          )}

          {course?.classes.map((classItem) =>
            classItem.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-lg p-4 text-zinc-600 backdrop-blur-2xl dark:bg-slate-800"
                style={{
                  boxShadow:
                    "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <a
                    href={`/assignments/${attachment.id}`}
                    className="cursor-pointer text-base font-semibold text-blue-600 hover:text-blue-500"
                  >
                    {attachment.title}
                  </a>
                  <div className="flex items-center text-sm font-medium">
                    {attachment.dueDate &&
                      new Date(attachment.dueDate).toLocaleDateString()}
                    {session.user.role === "STUDENT" && (
                      <div className="text-white">
                        {attachment.submissions.length !== 0 ? (
                          <h1 className="ml-1 rounded-full border-2 border-green-600/80 bg-green-500/40 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                            submitted
                          </h1>
                        ) : (
                          <h1 className="ml-1 rounded-full border-2 border-red-700 bg-red-500/40 px-2 py-1 text-xs text-red-600 dark:text-red-400">
                            not submitted
                          </h1>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {attachment.link && (
                  <div className="flex items-center justify-start space-x-2 text-sm hover:opacity-90">
                    <a
                      href={attachment.link}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Assignment
                    </a>
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 