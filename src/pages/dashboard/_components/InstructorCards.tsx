import { MdOutlineNoteAlt } from "react-icons/md";
import { PiStudentBold } from "react-icons/pi";
import { SiGoogleclassroom } from "react-icons/si";

import { InstructorDashboardData } from "@/types/dashboard";

import Holidays from "./Holidays";

interface Props {
  data: InstructorDashboardData;
}

export function InstructorCards({ data }: Props) {
  return (
    <div>
      <div className=" flex flex-wrap justify-center mb-10 gap-4">
        <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
          <MdOutlineNoteAlt className="m-auto h-24 w-24 text-blue-400" />
          <p className="pt-2 font-bold text-blue-600">{data.coursesCount}</p>
          <h1 className="p-1 text-sm font-bold">No of courses created</h1>
        </div>
        <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
          <SiGoogleclassroom className="m-auto h-24 w-24 text-blue-400" />
          <p className="pt-2 font-bold text-blue-600">{data.totalClasses}</p>
          <h1 className="p-1 text-sm font-bold">Total no of classes uploaded</h1>
        </div>
        <div className="w-80 rounded-md bg-white p-2 text-gray-900 shadow-xl">
          <PiStudentBold className="m-auto h-24 w-24 text-blue-400" />
          <p className="pt-2 font-bold text-blue-600">{data.enrolledStudents}</p>
          <h1 className="p-1 text-sm font-bold">Total no of students enrolled</h1>
        </div>
      </div>
      <div className="flex justify-end">
        <Holidays />
      </div>
    </div>
  );
}
