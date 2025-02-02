import StudentWiseAssignments from "@/components/StudentWiseAssignments";
import Providers from "@/utils/providers";

const AssignmentsPage = ({ courses, coursesWithAssignments, id }: any) => {
  return (
    <Providers>
      <div className="mx-2 flex flex-col gap-4 px-2 py-2 md:mx-6 md:px-8">
        <h1 className="py-2 text-center text-3xl font-semibold">ASSIGNMENTS</h1>
        {!coursesWithAssignments || coursesWithAssignments.length === 0 ? (
          <div className="text-center">No Assignments found!</div>
        ) : (
          <StudentWiseAssignments
            courses={courses}
            assignments={coursesWithAssignments}
            userId={id}
            client:load
          />
        )}
      </div>
    </Providers>
  );
};

export default AssignmentsPage;
