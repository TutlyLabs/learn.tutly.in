import { Role } from "@prisma/client";

export const organization = {
  name: "Tutly Org",
  orgCode: "TUTLY001",
};

export const courses = [
  {
    title: "Course 1",
    isPublished: true,
  },
  {
    title: "Course 2",
    isPublished: true,
  },
];

export const users = [
  {
    name: "Instructor 1",
    username: "INSTRUCTOR_001",
    email: "instructor@tutly.in",
    password: "instructor@123",
    role: Role.INSTRUCTOR,
  },
  {
    name: "Mentor 1",
    username: "MENTOR_001",
    email: "mentor1@tutly.in",
    password: "mentor@123",
    role: Role.MENTOR,
  },
  {
    name: "Mentor 2",
    username: "MENTOR_002",
    email: "mentor2@tutly.in",
    password: "mentor@123",
    role: Role.MENTOR,
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    name: `Student ${i + 1}`,
    username: `STUDENT_${String(i + 1).padStart(3, "0")}`,
    email: `student${i + 1}@tutly.in`,
    password: "student@123",
    role: Role.STUDENT,
  })),
];
