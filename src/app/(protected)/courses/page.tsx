import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import AddCourse from "./_components/AddCourse";
import CourseCard from "./_components/CourseCard";
import NoDataFound from "./_components/NoDataFound";
import { redirect } from "next/navigation";

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const currentUser = session.user;
  const courses = await api.courses.getAll();

  if (courses.length === 0) {
    return <NoDataFound message="No courses found!" />;
  }

  const publishedCourses = courses.filter((course) => course?.isPublished);
  const coursesFinal = currentUser.role === "INSTRUCTOR" ? courses : publishedCourses;

  return (
    <div className="w-full">
      <div className="flex w-full">
        {coursesFinal.length === 0 && (
          <div>
            {currentUser?.role === "INSTRUCTOR" ? (
              <AddCourse />
            ) : (
              <NoDataFound message="No courses found!" />
            )}
          </div>
        )}

        {coursesFinal.length > 0 && (
          <div className="flex flex-wrap">
            {coursesFinal.map((course) => (
              course && (
                <CourseCard
                  currentUser={currentUser}
                  key={course.id}
                  course={course}
                />
              )
            ))}
            {currentUser?.role === "INSTRUCTOR" && <AddCourse />}
          </div>
        )}
      </div>
    </div>
  );
} 