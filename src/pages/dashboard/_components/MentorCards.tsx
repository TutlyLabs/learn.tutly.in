import { MdOutlineNoteAlt } from "react-icons/md";
import { PiStudentBold } from "react-icons/pi";
import { SiTicktick } from "react-icons/si";

import { MentorDashboardData } from "@/types/dashboard";

interface Props {
  data: MentorDashboardData;
  selectedCourse: string;
}

export function MentorCards({ data, selectedCourse }: Props) {
  const course = data.courses.find((c) => c.courseId === selectedCourse);

  return (
    <div className="flex flex-wrap justify-center mb-10 gap-4">
      <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
        <PiStudentBold className="m-auto h-24 w-24 text-blue-400" />
        <p className="pt-2 font-bold text-blue-600">{course?.menteeCount || 0}</p>
        <h1 className="p-1 text-sm font-bold">Assigned mentees</h1>
      </div>
      <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
        <MdOutlineNoteAlt className="m-auto h-24 w-24 text-blue-400" />
        <p className="pt-2 font-bold text-blue-600">{course?.evaluatedAssignments || 0}</p>
        <h1 className="p-1 text-sm font-bold">Assignments evaluated</h1>
      </div>
      <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
        <SiTicktick className="m-auto my-2 h-20 w-20 text-blue-400" />
        <p className="pt-2 font-bold text-blue-600">{course?.totalSubmissions || 0}</p>
        <h1 className="p-1 text-sm font-bold">Total submissions</h1>
      </div>
    </div>
  );
}
