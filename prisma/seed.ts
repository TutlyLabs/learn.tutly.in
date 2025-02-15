import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type pointCategory = "OTHER" | "RESPOSIVENESS" | "STYLING";

const main = async () => {
  const submissions = await db.submission.findMany({
    where: {
      // attachmentId:"",
      enrolledUser: {
        mentorUsername: "",
        courseId: "",
      },
      points: {
        none: {},
      },
    },
  });

  const points = submissions.map((submission) => {
    return {
      submissionId: submission.id,
      score: 9,
      category: "OTHER" as pointCategory,
    };
  });

  const insertedPoints = await db.point.createMany({
    data: points,
  });
  console.log({ insertedPoints });
};

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
