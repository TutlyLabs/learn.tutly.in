"use client";

import { Notes } from "@prisma/client";

import { SessionUser } from "@/lib/auth/session";
import type { RouterOutputs } from "@/server";
import Providers from "@/utils/providers";

import Class from "./_components/Class";
import ClassSidebar from "./_components/classSidebar";

type ClassesWithFolders = RouterOutputs["classes"]["getClassesWithFolders"][0];
type ClassDetails = RouterOutputs["classes"]["getClassDetails"];

interface PageProps {
  classesWithFolders: ClassesWithFolders[];
  currentUser: SessionUser;
  classId: string;
  courseId: string;
  classDetails: ClassDetails;
  isBookmarked: boolean;
  initialNote: Notes | null;
}

const ClassPage = ({
  classesWithFolders,
  currentUser,
  classId,
  courseId,
  classDetails,
  isBookmarked,
  initialNote,
}: PageProps) => {
  return (
    <div>
      <Providers>
        <div className="flex items-start w-full">
          <ClassSidebar
            courseId={courseId}
            classes={classesWithFolders || []}
            title="Assignments"
            currentUser={currentUser}
            isCourseAdmin={currentUser.role === "INSTRUCTOR"}
          />
          <div className="m-3 w-full">
            <Class
              classes={classesWithFolders || []}
              classId={classId}
              courseId={courseId}
              currentUser={currentUser}
              details={classDetails}
              isBookmarked={isBookmarked}
              initialNote={initialNote}
            />
          </div>
        </div>
      </Providers>
    </div>
  );
};

export default ClassPage;
