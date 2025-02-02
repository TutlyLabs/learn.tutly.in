"use client";

import { RouterOutputs } from "@/server";
import Providers from "@/utils/providers";

import AssignmentPage from "../_components/AssignmentPage";

type User = RouterOutputs["users"]["getUser"];

const page = ({
  currentUser,
  assignment,
  sortedAssignments,
  notSubmittedMentees,
  isCourseAdmin,
  username,
  mentors,
  pagination,
}: {
  currentUser: User;
  assignment: any;
  sortedAssignments: any[];
  notSubmittedMentees: any[];
  isCourseAdmin: boolean;
  username: string;
  mentors: string[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}) => {
  return (
    <Providers>
      <AssignmentPage
        currentUser={currentUser}
        assignment={assignment}
        assignments={sortedAssignments}
        notSubmittedMentees={notSubmittedMentees}
        isCourseAdmin={isCourseAdmin}
        username={username ?? ""}
        mentors={mentors as string[]}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
        }}
      />
    </Providers>
  );
};

export default page;
