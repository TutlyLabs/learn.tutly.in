import { useEffect, useState } from "react";

import { DashboardData } from "@/types/dashboard";
import { getGreeting } from "@/utils/getGreeting";

import { InstructorCards } from "./InstructorCards";
import { MentorCards } from "./MentorCards";
import { StudentCards } from "./StudentCards";

interface Props {
  data: DashboardData | null;
  name: string | null;
}

const Dashboard = ({ data, name }: Props) => {
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

  const renderCourseSelector = () => {
    if ("courses" in data) {
      return (
        <p className="mt-3 text-base font-medium text-white">
          Here is your report for
          <select
            title="report"
            className="ml-2 rounded-md bg-white px-2 py-1 text-gray-900"
            onChange={(e) => setSelectedCourse(e.target.value)}
            value={selectedCourse}
          >
            {data.courses.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseTitle}
              </option>
            ))}
          </select>
        </p>
      );
    }
    return null;
  };

  return (
    <div className="m-2 h-60 rounded-lg bg-gradient-to-l from-blue-400 to-blue-600">
      <div className="p-10">
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()} {name} 👋
        </h1>
        {renderCourseSelector()}
      </div>
      <div className="p-2 text-center">{renderCards()}</div>
    </div>
  );
};

export default Dashboard;
