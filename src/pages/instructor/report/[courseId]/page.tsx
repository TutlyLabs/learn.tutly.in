import { Course } from "@prisma/client";

import Providers from "@/utils/providers";

import Report, { DataItem } from "./_components/Report";

function Page({ sortedData, courses, courseId }: any) {
  return (
    <Providers>
      <Report
        intitialdata={sortedData as DataItem[]}
        allCourses={courses as Course[]}
        courseId={courseId}
      />
    </Providers>
  );
}

export default Page;
