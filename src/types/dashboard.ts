import type { User } from "@prisma/client";

interface CourseData {
  courseId: string | undefined;
  courseTitle: string | undefined;
  assignments: any[];
}

export interface StudentCourseData extends CourseData {
  assignmentsSubmitted: number;
  totalPoints: number;
  totalAssignments: number;
}

export interface MentorCourseData extends CourseData {
  menteeCount: number;
  evaluatedAssignments: number;
  totalSubmissions: number;
}

export type StudentDashboardData = {
  courses: StudentCourseData[];
  currentUser: User;
};

export type MentorDashboardData = {
  courses: MentorCourseData[];
};

export type InstructorDashboardData = {
  coursesCount: number;
  totalClasses: number;
  enrolledStudents: number;
};

export type DashboardData = StudentDashboardData | MentorDashboardData | InstructorDashboardData;
