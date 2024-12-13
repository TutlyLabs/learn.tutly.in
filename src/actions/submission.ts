import type { Attachment, EnrolledUsers, Point, User, submission } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export interface AssignmentDetails {
  id: string;
  maxSubmissions: number;
  class: {
    courseId: string;
  };
}

export interface MentorDetails {
  mentor: {
    username: string;
  };
}

export const createSubmission = defineAction({
  input: z.object({
    assignmentDetails: z.object({
      id: z.string(),
      maxSubmissions: z.number(),
      class: z.object({
        courseId: z.string(),
      }),
    }),
    files: z.any(),
    mentorDetails: z.object({
      mentor: z.object({
        username: z.string(),
      }),
    }),
  }),
  async handler({ assignmentDetails, files, mentorDetails }, { locals }) {
    const user = locals.user;
    if (!user) {
      return { error: "unauthorized" };
    }

    const submissions = await db.submission.findMany({
      where: {
        attachmentId: assignmentDetails.id,
        enrolledUser: {
          username: user.username,
        },
      },
    });

    if (submissions.length >= assignmentDetails.maxSubmissions) {
      return { error: "Maximum submission limit reached" };
    }

    const enrolledUser = await db.enrolledUsers.findUnique({
      where: {
        username_courseId_mentorUsername: {
          username: user.username,
          courseId: assignmentDetails.class.courseId,
          mentorUsername: mentorDetails.mentor.username,
        },
      },
    });
    if (!enrolledUser) return { error: "Not enrolled" };

    const submission = await db.submission.create({
      data: {
        attachmentId: assignmentDetails.id,
        enrolledUserId: enrolledUser.id,
        data: files,
      },
    });

    await db.events.create({
      data: {
        eventCategory: "ASSIGNMENT_SUBMISSION",
        causedById: user.id,
        eventCategoryDataId: submission.id,
      },
    });

    return { success: true, data: submission };
  },
});

export const addOverallFeedback = defineAction({
  input: z.object({
    submissionId: z.string(),
    feedback: z.string(),
  }),
  async handler({ submissionId, feedback }, { locals }) {
    const user = locals.user;
    if (!user) {
      return { error: "unauthorized" };
    }

    const submission = await db.submission.findUnique({
      where: {
        id: submissionId,
      },
    });

    if (!submission) {
      return { error: "submission not found" };
    }

    const updatedSubmission = await db.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        overallFeedback: feedback,
      },
    });

    return { success: true, data: updatedSubmission };
  },
});

interface SubmissionWithDetails extends submission {
  enrolledUser: EnrolledUsers & {
    user: User;
  };
  points: Point[];
  assignment: Attachment;
  submissionCount?: number;
  submissionIndex?: number;
}

export const getAssignmentSubmissions = defineAction({
  input: z.object({
    assignmentId: z.string(),
  }),
  async handler({ assignmentId }, { locals }) {
    const user = locals.user;
    if (!user || user.role === "STUDENT") {
      return { error: "Unauthorized" };
    }

    const assignment = await db.attachment.findUnique({
      where: {
        id: assignmentId,
      },
    });

    const submissions = await db.submission.findMany({
      where: {
        attachmentId: assignmentId,
      },
      include: {
        enrolledUser: {
          include: {
            user: true,
          },
        },
        points: true,
        assignment: true,
      },
      orderBy: {
        enrolledUser: {
          username: "asc",
        },
      },
    });

    let filteredSubmissions: SubmissionWithDetails[] = [];

    if (user.role === "INSTRUCTOR") {
      filteredSubmissions = submissions as SubmissionWithDetails[];
    }

    if (user.role === "MENTOR") {
      filteredSubmissions = submissions.filter(
        (submission) => submission.enrolledUser.mentorUsername === user.username
      ) as SubmissionWithDetails[];
    }

    if (assignment?.maxSubmissions && assignment.maxSubmissions > 1) {
      const submissionCount = await db.submission.groupBy({
        by: ["enrolledUserId"],
        where: {
          attachmentId: assignmentId,
        },
        _count: {
          id: true,
        },
      });

      filteredSubmissions.forEach((submission) => {
        const submissionCountData = submissionCount.find(
          (data) => data.enrolledUserId === submission.enrolledUserId
        );
        if (submissionCountData) {
          submission.submissionCount = submissionCountData._count.id;
        }
      });

      filteredSubmissions.forEach((submission) => {
        submission.submissionIndex = 1;
        if (submission.submissionCount && submission.submissionCount > 1) {
          const submissionIndex =
            submissions
              .filter((sub) => sub.enrolledUserId === submission.enrolledUserId)
              .findIndex((sub) => sub.id === submission.id) || 0;
          submission.submissionIndex = submissionIndex + 1;
        }
      });
    }

    return { success: true, data: filteredSubmissions };
  },
});

export const getAllAssignmentSubmissions = defineAction({
  async handler(_, { locals }) {
    const user = locals.user;
    if (!user || user.role === "STUDENT") {
      return { error: "Unauthorized" };
    }

    const submissions = await db.submission.findMany({
      include: {
        enrolledUser: {
          include: {
            user: true,
          },
        },
        points: true,
        assignment: true,
      },
      orderBy: {
        enrolledUser: {
          username: "asc",
        },
      },
    });

    let filteredSubmissions: SubmissionWithDetails[] = [];

    if (user.role === "INSTRUCTOR") {
      filteredSubmissions = submissions as SubmissionWithDetails[];
    }

    if (user.role === "MENTOR") {
      filteredSubmissions = submissions.filter(
        (submission) => submission.enrolledUser.mentorUsername === user.username
      ) as SubmissionWithDetails[];
    }

    const submissionsByAssignment = filteredSubmissions.reduce(
      (acc, submission) => {
        if (!acc[submission.attachmentId]) {
          acc[submission.attachmentId] = [];
        }
        acc[submission.attachmentId]?.push(submission);
        return acc;
      },
      {} as Record<string, SubmissionWithDetails[]>
    );

    for (const [attachmentId, assignmentSubmissions] of Object.entries(submissionsByAssignment)) {
      const assignment = await db.attachment.findUnique({
        where: {
          id: attachmentId,
        },
      });

      if (assignment?.maxSubmissions && assignment.maxSubmissions > 1) {
        const submissionCount = await db.submission.groupBy({
          by: ["enrolledUserId"],
          where: {
            attachmentId: attachmentId,
          },
          _count: {
            id: true,
          },
        });

        assignmentSubmissions.forEach((submission) => {
          const submissionCountData = submissionCount.find(
            (data) => data.enrolledUserId === submission.enrolledUserId
          );
          if (submissionCountData) {
            submission.submissionCount = submissionCountData._count.id;
          }
        });

        assignmentSubmissions.forEach((submission) => {
          submission.submissionIndex = 1;
          if (submission.submissionCount && submission.submissionCount > 1) {
            const submissionIndex =
              assignmentSubmissions
                .filter((sub) => sub.enrolledUserId === submission.enrolledUserId)
                .findIndex((sub) => sub.id === submission.id) || 0;
            submission.submissionIndex = submissionIndex + 1;
          }
        });
      }
    }

    return { success: true, data: filteredSubmissions };
  },
});

export const getSubmissionById = defineAction({
  input: z.object({
    submissionId: z.string(),
  }),
  async handler({ submissionId }, { locals }) {
    const user = locals.user;
    if (!user) {
      return { error: "Unauthorized" };
    }

    const submission = await db.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        enrolledUser: true,
        points: true,
      },
    });

    if (!submission && submissionId) {
      return { error: "Submission not found" };
    }

    return { success: true, data: submission };
  },
});

export const deleteSubmission = defineAction({
  input: z.object({
    submissionId: z.string(),
  }),
  async handler({ submissionId }, { locals }) {
    const user = locals.user;
    // todo: add proper auth check
    const haveAccess = user?.role === "INSTRUCTOR" || user?.role === "MENTOR";
    if (!user || !haveAccess) {
      return { error: "Unauthorized" };
    }

    await db.submission.delete({
      where: {
        id: submissionId,
      },
    });

    return { success: true };
  },
});

export const submitExternalLink = defineAction({
  input: z.object({
    assignmentId: z.string(),
    maxSubmissions: z.number(),
    externalLink: z.string(),
    courseId: z.string(),
  }),
  async handler({ assignmentId, maxSubmissions, externalLink, courseId }, { locals }) {
    const user = locals.user;
    if (!user) {
      return { error: "Unauthorized" };
    }

    const submissions = await db.submission.findMany({
      where: {
        attachmentId: assignmentId,
        enrolledUser: {
          username: user.username,
        },
      },
    });

    if (submissions.length >= maxSubmissions) {
      return { error: "Maximum submission limit reached" };
    }

    const enrolledUser = await db.enrolledUsers.findUnique({
      where: {
        username_courseId_mentorUsername: {
          username: user.username,
          courseId: courseId,
          mentorUsername: user.username,
        },
      },
    });

    if (!enrolledUser) {
      return { error: "User not enrolled in the course" };
    }

    await db.submission.create({
      data: {
        enrolledUserId: enrolledUser.id,
        attachmentId: assignmentId,
        submissionLink: externalLink,
      },
    });

    return { success: true };
  },
});
