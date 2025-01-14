"use client";

import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { MdHolidayVillage } from "react-icons/md";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardData } from "@/types/dashboard";
import { getGreeting } from "@/utils/getGreeting";

import { InstructorCards } from "./InstructorCards";
import { MentorCards } from "./MentorCards";
import { StudentCards } from "./StudentCards";

interface Props {
  data: DashboardData | null;
  name: string | null;
  holidays: any;
  currentUser: any;
}

const Dashboard = ({ data, name, holidays, currentUser }: Props) => {
  if (!data) return <div>No data available</div>;

  const [selectedCourse, setSelectedCourse] = useState<string>("");

  useEffect(() => {
    if ("courses" in data && data.courses.length > 0) {
      setSelectedCourse(data.courses[0]?.courseId || "");
    }
  }, [data]);

  const renderCards = () => {
    if ("currentUser" in data) {
      return <StudentCards data={data} selectedCourse={selectedCourse} />;
    } else if ("courses" in data) {
      return <MentorCards data={data} selectedCourse={selectedCourse} />;
    } else {
      return <InstructorCards data={data} />;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await actions.holidays_deleteHoliday({ id });
      window.location.reload();
    } catch (error) {
      console.error("Error deleting holiday", error);
    }
  };

  const renderCourseSelector = () => {
    if ("courses" in data) {
      return (
        <div className="text-base font-medium text-white">
          <Select
            value={selectedCourse}
            onValueChange={(value) => setSelectedCourse(value)}
            defaultValue={data.courses[0]?.courseId || ""}
          >
            <SelectTrigger className="ml-2 rounded-md bg-white px-2 py-1 text-gray-900">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent align="end">
              {data.courses.map((course) => (
                <SelectItem key={course.courseId} value={course.courseId || ""}>
                  {course.courseTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="m-2 h-40 rounded-lg bg-gradient-to-l from-blue-400 to-blue-600">
      <div className="flex md:flex-row flex-col justify-between items-center p-8">
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()} {name} 👋
        </h1>
        <div className="md:mt-0 mt-6">{renderCourseSelector()}</div>
      </div>
      <div className="p-2 text-center">{renderCards()}</div>
      {(currentUser?.role === "INSTRUCTOR" || currentUser?.role === "MENTOR") && (
        <div className="overflow-x-auto bg-gray-900 rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold text-slate-300 mb-4">List of Holidays</h2>
          {(holidays && holidays.length) > 0 ? (
            <table className="w-full table-auto">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Reason</th>
                  <th className="px-6 py-3 text-left font-medium">Description</th>
                  <th className="px-6 py-3 text-left font-medium">From</th>
                  <th className="px-6 py-3 text-left font-medium">To</th>
                  {currentUser.role === "INSTRUCTOR" && (
                    <th className="px-6 py-3 text-left font-medium">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-gray-200">
                {holidays.map((holiday: any) => (
                  <tr key={holiday.id} className="border-b border-gray-700 transition duration-200">
                    <td className="px-6 py-4">{holiday.reason}</td>
                    <td className="px-6 py-4">
                      {holiday.description || "No description available"}
                    </td>
                    <td className="px-6 py-4">{new Date(holiday.startDate).toDateString()}</td>
                    <td className="px-6 py-4">{new Date(holiday.endDate).toDateString()}</td>
                    {currentUser.role === "INSTRUCTOR" && (
                      <td className="flex gap-6 px-6 py-4 text-blue-400">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <h1 className="cursor-pointer">Delete</h1>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete Holiday.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(holiday.id)}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col justify-center items-center text-white p-2">
              <MdHolidayVillage className="md:w-24 md:h-24 h-16 w-16" />
              <h1 className="font-semibold text-base">No holidays</h1>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
