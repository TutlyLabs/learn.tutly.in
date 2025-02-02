import NoDataFound from "@/components/NoDataFound";
import { type RouterOutputs } from "@/server";
import Providers from "@/utils/providers";

import AssignmentBoard from "./_components/AssignmentBoard";

type Course = RouterOutputs["assignments"]["getAssignmentsPageData"]["courses"][0];
type Assignment = RouterOutputs["assignments"]["getAssignmentsPageData"]["assignments"][0];

const page = ({ courses, assignments }: { courses: Course[]; assignments: Assignment[] }) => {
  return (
    <Providers>
      <div className="mx-2 flex flex-col gap-4 px-2 py-2 md:px-6">
        {!courses || courses.length === 0 ? (
          <div className="mt-20 p-4 text-center font-semibold">
            <NoDataFound message="No Assignments available" />
          </div>
        ) : (
          <AssignmentBoard reviewed={true} courses={courses} assignments={assignments} />
        )}
      </div>
    </Providers>
  );
};

export default page;
