import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const getAllCourses = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    try {
      if (!currentUser) return { error: "Unauthorized" };

      let courses;
      // replace 1 with currentUser.role === "INSTRUCTOR"
      // duplicate id with currentUser.id
      if (1) {
        courses = await db.course.findMany({
          where: {
            createdById: "b8381259-8ff7-4de0-bf03-d37ca35d7402",
          },
          include: {
            _count: {
              select: {
                classes: true,
              },
            },
          },
        });
      } else if (currentUser.role === "MENTOR") {
        courses = await db.course.findMany({
          where: {
            enrolledUsers: {
              some: {
                mentorUsername: currentUser.username,
              },
            },
          },
          include: {
            _count: {
              select: {
                classes: true,
              },
            },
          },
        });
      } else {
        courses = await db.course.findMany({
          where: {
            enrolledUsers: {
              some: {
                user: {
                  id: currentUser.id,
                },
              },
            },
          },
          include: {
            _count: {
              select: {
                classes: true,
              },
            },
          },
        });
      }
      
      return { success: true, data: courses };
    } catch (e) {
      console.error("Detailed error while fetching courses:", e);
      return { error: "Failed to fetch courses", details: e instanceof Error ? e.message : String(e) };
    }
  },
});

export const getCourseClasses = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const classes = await db.class.findMany({
      where: {
        courseId: id,
      },
      include: {
        course: true,
        video: true,
        attachments: true,
        Folder: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return { success: true, data: classes };
  },
});

export const foldersByCourseId = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    const folders = await db.folder.findMany({
      where: {
        Class: {
          some: {
            courseId: id,
          },
        },
      },
    });
    return folders ?? [];
  },
});

export const getEnrolledCourses = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            username: currentUser.username,
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
        courseAdmins: true,
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    const publishedCourses = courses.filter((course) => course.isPublished);

    if (currentUser.role === "INSTRUCTOR") {
      return { success: true, data: courses };
    }
    return { success: true, data: publishedCourses };
  },
});

export const getCreatedCourses = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courses = await db.course.findMany({
      where: {
        createdById: currentUser.id,
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    return { success: true, data: courses };
  },
});

export const getEnrolledCoursesById = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    const courses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            user: {
              id: id,
            },
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });
    return { success: true, data: courses };
  },
});

export const getEnrolledCoursesByUsername = defineAction({
  input: z.object({
    username: z.string(),
  }),
  async handler({ username }) {
    const courses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            user: {
              username: username,
            },
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });
    return { success: true, data: courses };
  },
});

export const getMentorStudents = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const students = await db.user.findMany({
      where: {
        role: "STUDENT",
        enrolledUsers: {
          some: {
            mentorUsername: currentUser.username,
            courseId,
          },
        },
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return { success: true, data: students };
  },
});

export const getMentorStudentsById = defineAction({
  input: z.object({
    id: z.string(),
    courseId: z.string(),
  }),
  async handler({ id, courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const students = await db.user.findMany({
      where: {
        enrolledUsers: {
          some: {
            mentorUsername: id,
            courseId: courseId,
          },
        },
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return { success: true, data: students };
  },
});

export const getEnrolledStudents = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const students = await db.user.findMany({
      where: {
        enrolledUsers: {
          some: {
            course: {
              id: courseId,
            },
          },
        },
        role: "STUDENT",
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
    });

    return { success: true, data: students };
  },
});

export const getAllStudents = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const students = await db.user.findMany({
      where: {
        role: "STUDENT",
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
    });

    return { success: true, data: students };
  },
});

export const getEnrolledMentees = defineAction({
  input: z.object({
    courseId: z.string(),
  }),
  async handler({ courseId }, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const students = await db.user.findMany({
      where: {
        role: "MENTOR",
        enrolledUsers: {
          some: {
            course: {
              id: courseId,
            },
          },
        },
      },
      include: {
        course: true,
        enrolledUsers: true,
      },
    });

    return { success: true, data: students };
  },
});

export const createCourse = defineAction({
  input: z.object({
    title: z.string(),
    isPublished: z.boolean(),
    image: z.string().optional(),
  }),
  async handler({ title, isPublished, image }, { locals }) {
    const currentUser = locals.user;
    if (currentUser?.role !== "INSTRUCTOR") return { error: "Unauthorized" };
    if (!title.trim()) {
      return { error: "Title is required" };
    }

    const newCourse = await db.course.create({
      data: {
        title: title,
        createdById: currentUser.id,
        isPublished: isPublished,
        image: image || null,
        enrolledUsers: {
          create: {
            username: currentUser.username,
          },
        },
      },
    });
    return { success: true, data: newCourse };
  },
});

export const updateCourse = defineAction({
  input: z.object({
    id: z.string(),
    title: z.string(),
    isPublished: z.boolean(),
    image: z.string().optional(),
  }),
  async handler({ id, title, isPublished, image }, { locals }) {
    const currentUser = locals.user;
    if (currentUser?.role !== "INSTRUCTOR") return { error: "Unauthorized" };

    if (!title.trim()) {
      return { error: "Title is required" };
    }

    const course = await db.course.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        isPublished: isPublished,
        image: image || null,
      },
    });
    return course;
  },
});

export const getMentorCourses = defineAction({
  async handler(_, { locals }) {
    const currentUser = locals.user;
    if (!currentUser) return { error: "Unauthorized" };

    const courses = await db.course.findMany({
      where: {
        enrolledUsers: {
          some: {
            mentorUsername: currentUser.username,
          },
        },
      },
      include: {
        classes: true,
        createdBy: true,
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    courses.forEach((course) => {
      course.classes.sort((a, b) => {
        return Number(a.createdAt) - Number(b.createdAt);
      });
    });

    return { success: true, data: courses };
  },
});

export const getClassDetails = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    try {
      const classDetails = await db.class.findUnique({
        where: {
          id: id,
        },
        include: {
          video: true,
          attachments: true,
          Folder: true,
        },
      });

      if (!classDetails) {
        return { success: false, error: "Class not found" };
      }

      return { success: true, data: classDetails };
    } catch (error) {
      console.error("Error fetching class details:", error);
      return { success: false, error: "Failed to fetch class details" };
    }
  },
});

export const getCourseByCourseId = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    const course = await db.course.findUnique({
      where: {
        id: id,
      },
    });
    return { success: true, data: course };
  },
});

export const enrollStudentToCourse = defineAction({
  input: z.object({
    courseId: z.string(),
    username: z.string(),
  }),
  async handler({ courseId, username }, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser || currentUser.role !== "INSTRUCTOR") {
        return { error: "Unauthorized to enroll student to course" };
      }

      const user = await db.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        return { error: "User not found" };
      }

      const course = await db.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return { error: "Course not found" };
      }

      const existingEnrollment = await db.enrolledUsers.findFirst({
        where: {
          courseId: courseId,
          username: username,
        },
      });

      if (existingEnrollment) {
        return { error: "User is already enrolled in the course" };
      }

      const newEnrollment = await db.enrolledUsers.create({
        data: {
          courseId: courseId,
          username: username,
        },
      });

      await db.events.create({
        data: {
          eventCategory: "STUDENT_ENROLLMENT_IN_COURSE",
          causedById: currentUser.id,
          eventCategoryDataId: newEnrollment.id,
        },
      });

      return { success: true, data: newEnrollment };
    } catch {
      return { error: "Failed to enroll student" };
    }
  },
});

export const unenrollStudentFromCourse = defineAction({
  input: z.object({
    courseId: z.string(),
    username: z.string(),
  }),
  async handler({ courseId, username }, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser || currentUser.role !== "INSTRUCTOR") {
        return { error: "Unauthorized to unenroll student from course" };
      }

      const user = await db.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        return { error: "User not found" };
      }

      const course = await db.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return { error: "Course not found" };
      }

      const existingEnrollment = await db.enrolledUsers.findFirst({
        where: {
          courseId: courseId,
          username: username,
        },
      });

      if (!existingEnrollment) {
        return { error: "User is not enrolled in the course" };
      }

      await db.enrolledUsers.delete({
        where: {
          id: existingEnrollment.id,
        },
      });

      return { success: true, data: existingEnrollment };
    } catch {
      return { error: "Failed to unenroll student" };
    }
  },
});

export const updateRole = defineAction({
  input: z.object({
    username: z.string(),
    role: z.enum(["STUDENT", "MENTOR"]),
  }),
  async handler({ username, role }, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser || currentUser.role !== "INSTRUCTOR") {
        return { error: "Unauthorized to update user role" };
      }

      const user = await db.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        return { error: "User not found" };
      }

      const updatedUser = await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          role: role,
        },
      });

      return { success: true, data: updatedUser };
    } catch {
      return { error: "Failed to update user role" };
    }
  },
});

export const updateMentor = defineAction({
  input: z.object({
    courseId: z.string(),
    username: z.string(),
    mentorUsername: z.string(),
  }),
  async handler({ courseId, username, mentorUsername }, { locals }) {
    try {
      const currentUser = locals.user;
      if (!currentUser || currentUser.role !== "INSTRUCTOR") {
        return { error: "Unauthorized to update mentor" };
      }

      const enrolledUser = await db.enrolledUsers.findFirst({
        where: {
          courseId: courseId,
          username: username,
        },
      });

      if (!enrolledUser) {
        return { error: "User is not enrolled in the course" };
      }

      const updatedUser = await db.enrolledUsers.update({
        where: {
          id: enrolledUser.id,
        },
        data: {
          mentorUsername: mentorUsername,
        },
      });

      return { success: true, data: updatedUser };
    } catch {
      return { error: "Failed to update mentor" };
    }
  },
});

export const deleteCourse = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }, { locals }) {
    const currentUser = locals.user;
    if (currentUser?.role !== "INSTRUCTOR") return { error: "Unauthorized" };

    try {
      await db.course.delete({
        where: {
          id: id,
          createdById: currentUser.id,
        },
      });

      return { success: true };
    } catch {
      return { error: "Failed to delete course" };
    }
  },
});
