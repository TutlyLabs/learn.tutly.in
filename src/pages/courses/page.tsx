"use client";

import NoDataFound from "@/components/NoDataFound";
import type { RouterOutputs } from "@/server";
import Providers from "@/utils/providers";

import AddCourse from "./_components/AddCourse";
import CourseCard from "./_components/CourseCard";

type Course = RouterOutputs["courses"]["getUserCourses"][0];
type User = RouterOutputs["users"]["getCurrentUser"];

interface PageProps {
  coursesFinal: Course[];
  currentUser: User;
}

const CoursesPage = ({ coursesFinal, currentUser }: PageProps) => {
  return (
    <Providers>
      <div className="w-full">
        <div className="flex w-full">
          {coursesFinal?.length === 0 && (
            <div>
              {currentUser?.role === "INSTRUCTOR" ? (
                <AddCourse />
              ) : (
                <NoDataFound message="No courses found!" />
              )}
            </div>
          )}

          {coursesFinal?.length > 0 && (
            <div className="flex flex-wrap">
              {coursesFinal.map((course) => (
                <CourseCard currentUser={currentUser} key={course.id} course={course} />
              ))}
              {currentUser?.role === "INSTRUCTOR" && <AddCourse />}
            </div>
          )}
        </div>
      </div>
    </Providers>
  );
};

export default CoursesPage;
