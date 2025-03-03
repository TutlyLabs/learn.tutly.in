const Header = ({
  data,
  courseId,
  userRole,
}: {
  data: any;
  courseId: string;
  userRole: "INSTRUCTOR" | "MENTOR";
}) => {
  return (
    <div className="flex justify-between mx-4 md:mx-8 mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {data?.data?.map((course: any) => (
          <a
            href={`/tutor/statistics/${course.id}${userRole === "MENTOR" ? "?mentor=" + data.username : ""}`}
            className={`p-2 px-4 border rounded-lg transition-colors hover:bg-accent ${
              course.id === courseId ? "border-primary bg-accent" : ""
            }`}
            key={course.id}
          >
            {course.title}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Header;
