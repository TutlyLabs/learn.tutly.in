"use client";

import { Course } from "@prisma/client";

import Providers from "@/utils/providers";

import Leaderboard from "./_components/leaderboard";

const page = ({
  currentUser,
  sortedSubmissions,
  enrolledCourses,
}: {
  currentUser: any;
  sortedSubmissions: any;
  enrolledCourses: Course[];
}) => {
  return (
    <Providers>
      <Leaderboard
        currentUser={currentUser}
        submissions={sortedSubmissions}
        courses={enrolledCourses}
      />
    </Providers>
  );
};

export default page;
