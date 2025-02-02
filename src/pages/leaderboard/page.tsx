'use client'
import { Course } from "@prisma/client";
import Leaderboard from "./_components/leaderboard";

const page = ({
  currentUser,
  sortedSubmissions,
  enrolledCourses
}:{
  currentUser: any,
  sortedSubmissions: any,
  enrolledCourses: Course[]
}) => {
  return (
    <div>
      <Leaderboard
        currentUser={currentUser}
        submissions={sortedSubmissions}
        courses={enrolledCourses}
      />
    </div>
  )
}

export default page