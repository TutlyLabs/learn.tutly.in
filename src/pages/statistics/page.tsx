import StudentStats from "@/components/studentStats";
import Providers from "@/utils/providers";

const Stats = ({ courseId, data, studentData, attendanceData }: any) => {
  return (
    <Providers>
      <div className="flex gap-2 items-center mx-4 md:mx-8 mb-2">
        {data?.data?.map((course: any) => (
          <a
            href={`/statistics/${course.id}`}
            className={`p-1 px-2 border rounded-lg ${course.id === courseId ? "border-primary" : ""}`}
          >
            {course.title}
          </a>
        ))}
      </div>
      <StudentStats client:load studentData={studentData} attendanceData={attendanceData} />
    </Providers>
  );
};

export default Stats;
