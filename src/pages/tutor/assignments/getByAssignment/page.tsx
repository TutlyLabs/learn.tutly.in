import Providers from "@/utils/providers"
import SingleAssignmentBoard from "../_components/assignmentBoard";
import NoDataFound from "@/components/NoDataFound";

const GetByAssignment = ({sortedAssignments,courses}:any) => {
  return (
    <Providers>
        <div className="flex flex-col gap-4 py-2 md:mx-14 md:px-8">
            <div>
            <h1
                className="m-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 py-2 text-center text-xl font-semibold"
            >
                Students
            </h1>
            {
                courses && courses.length > 0 ? (
                <>
                    <SingleAssignmentBoard
                    courses={courses}
                    assignments={sortedAssignments as any}
                    />
                </>
                ) : (
                <NoDataFound message="No students found!"/>
                )
            }
            </div>
        </div>
    </Providers>
  )
}

export default GetByAssignment