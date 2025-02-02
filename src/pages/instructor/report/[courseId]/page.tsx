import { Course } from "@prisma/client"
import Report, { DataItem } from "./_components/Report"

function Page({sortedData,courses,courseId}:any) {
  return (
    <div>
        <Report
            intitialdata={sortedData as DataItem[]}
            allCourses={courses as Course[]}
            courseId={courseId}
        />
    </div>
  )
}

export default Page