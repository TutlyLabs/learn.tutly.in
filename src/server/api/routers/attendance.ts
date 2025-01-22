import { z } from "zod";
import { createTRPCRouter, instructorProcedure, protectedProcedure } from "../trpc";
import { and, eq } from "drizzle-orm";
import { attendance } from "~/server/db/schema";

export const attendanceRouter = createTRPCRouter({
  // postAttendance: instructorProcedure
  //   .input(
  //     z.object({
  //       classId: z.string(),
  //       data: z.array(z.any()),
  //       maxInstructionDuration: z.number(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const attendanceRecords = input.data.map((student: any) => ({
  //       classId: input.classId,
  //       userId: student.userId,
  //       attendedDuration: student.Duration,
  //       data: student?.Joins,
  //       attended: student.Duration >= (60 * input.maxInstructionDuration) / 100,
  //     }));

  //     const result = await ctx.db.insert(attendance).values(attendanceRecords).returning();
  //     return result;
  //   }),

  // getAttendanceForMentorBarChart: protectedProcedure
  //   .input(z.object({ courseId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const currentUser = ctx.session.user;

  //     const classRecords = await ctx.db.query.classes.findMany({
  //       where: eq(classes.courseId, input.courseId),
  //       with: {
  //         attendance: {
  //           where: currentUser.role === "MENTOR"
  //             ? and(
  //               eq(attendance.userId, currentUser.id),
  //               eq(attendance.attended, true)
  //             )
  //             : eq(attendance.attended, true),
  //         },
  //       },
  //       orderBy: (classes, { asc }) => [asc(classes.createdAt)],
  //     });

  //     const classes = classRecords.map(c => c.createdAt.toISOString().split("T")[0]);
  //     const attendanceInEachClass = classRecords.map(c => c.attendance.length);

  //     return { classes, attendanceInEachClass };
  //   }),
}); 