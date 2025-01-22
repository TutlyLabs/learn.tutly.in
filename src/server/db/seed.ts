import { db } from "~/server/db";
import * as schema from "./schema";
import { faker } from "@faker-js/faker";
import { Role } from "./types";

async function main() {
  console.log("🌱 Starting seeding...");

  try {
    // Clean existing data
    await db.delete(schema.organizations);
    console.log("🧹 Cleaned existing data");

    // Create organization
    const organization = await db
      .insert(schema.organizations)
      .values({
        name: "Demo Organization",
        orgCode: "DEMO-ORG",
      })
      .returning()
      .then((res) => res[0]!);

    console.log("🏢 Created organization");

    const roles: Role[] = ["ADMIN", "INSTRUCTOR", "MENTOR", "STUDENT"];
    const users = await Promise.all(
      Array.from({ length: 20 }, async (_, i) => {
        const role = roles[i % roles.length];
        return db
          .insert(schema.users)
          .values({
            name: faker.person.fullName(),
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.userName().toLowerCase(),
            role,
            organizationId: organization.id,
            image: faker.image.avatar(),
            lastSeen: faker.date.recent(),
          })
          .returning()
          .then((res) => res[0]!);
      }),
    );

    console.log("👥 Created users");

    // Create profiles for users
    await Promise.all(
      users.map((user) =>
        db.insert(schema.profiles).values({
          userId: user.id,
          dateOfBirth: faker.date.past(),
          hobbies: [faker.word.words(1), faker.word.words(1)],
          aboutMe: faker.lorem.paragraph(),
          mobile: faker.phone.number(),
          gender: faker.person.sex(),
          secondaryEmail: faker.internet.email().toLowerCase(),
          whatsapp: faker.phone.number(),
          tshirtSize: faker.helpers.arrayElement(["S", "M", "L", "XL", "XXL"]),
          socialLinks: JSON.stringify({
            facebook: faker.internet.url(),
            linkedin: faker.internet.url(),
            twitter: faker.internet.url(),
          }),
          professionalProfiles: JSON.stringify({
            github: faker.internet.url(),
            leetcode: faker.internet.url(),
            codechef: faker.internet.url(),
          }),
          academicDetails: JSON.stringify({
            rollNumber: faker.number.int({ min: 1000, max: 9999 }).toString(),
            cgpa: faker.number.float({ min: 6, max: 10 }),
            branch: faker.helpers.arrayElement([
              "CSE",
              "ECE",
              "IT",
              "MECH",
              "CIVIL",
            ]),
          }),
          // experiences: [
          //   {
          //     company: faker.company.name(),
          //     role: faker.person.jobTitle(),
          //     workLocation: faker.location.city(),
          //     workCity: faker.location.city(),
          //     startDate: faker.date.past().toISOString(),
          //     endDate: faker.date.future().toISOString(),
          //   },
          // ],
          address: JSON.stringify({
            building: faker.location.streetAddress(),
            street: faker.location.street(),
            city: faker.location.city(),
            state: faker.location.state(),
            country: faker.location.country(),
            pincode: faker.location.zipCode(),
          }),
          documents: JSON.stringify({
            resume: faker.internet.url(),
          }),
        }),
      ),
    );

    console.log("👤 Created user profiles");

    // Create files
    const files = await Promise.all(
      Array.from({ length: 10 }, () =>
        db
          .insert(schema.files)
          .values({
            name: faker.system.fileName(),
            internalName: faker.system.fileName(),
            fileType: faker.helpers.arrayElement([
              "AVATAR",
              "ATTACHMENT",
              "NOTES",
              "OTHER",
            ]),
            isPublic: faker.datatype.boolean(),
            publicUrl: faker.internet.url(),
            isUploaded: true,
            uploadedById: faker.helpers.arrayElement(users).id,
            isArchived: faker.datatype.boolean(),
            archivedById: faker.helpers.arrayElement(users).id,
            archiveReason: faker.lorem.sentence(),
            archivedAt: faker.date.past(),
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📁 Created files");

    // Create push subscriptions
    await Promise.all(
      users.map((user) =>
        db.insert(schema.pushSubscriptions).values({
          endpoint: faker.internet.url(),
          p256dh: faker.string.alphanumeric(32),
          auth: faker.string.alphanumeric(16),
          userId: user.id,
        }),
      ),
    );

    console.log("🔔 Created push subscriptions");

    // Create notifications
    await Promise.all(
      users.map((user) =>
        db.insert(schema.notifications).values({
          intendedForId: user.id,
          mediumSent: faker.helpers.arrayElement([
            "PUSH",
            "NOTIFICATION",
            "EMAIL",
            "WHATSAPP",
            "SMS",
          ]),
          customLink: faker.internet.url(),
          causedById: faker.helpers.arrayElement(users).id,
          eventType: faker.helpers.arrayElement([
            "CLASS_CREATED",
            "ASSIGNMENT_CREATED",
            "ASSIGNMENT_REVIEWED",
            "LEADERBOARD_UPDATED",
            "DOUBT_RESPONDED",
            "ATTENDANCE_MISSED",
            "CUSTOM_MESSAGE",
          ]),
          message: faker.lorem.sentence(),
          causedObjects: JSON.stringify({
            objectId: faker.string.uuid(),
            objectType: "ASSIGNMENT",
          }),
          readAt: faker.helpers.arrayElement([null, faker.date.recent()]),
        }),
      ),
    );

    console.log("📫 Created notifications");

    // Create courses
    const instructors = users.filter((u) => u.role === "INSTRUCTOR");
    const courses = await Promise.all(
      Array.from({ length: 10 }, async () =>
        db
          .insert(schema.courses)
          .values({
            title: faker.lorem.words(3),
            createdById: faker.helpers.arrayElement(instructors).id,
            image: faker.image.url(),
            startDate: faker.date.past(),
            endDate: faker.date.future(),
            isPublished: true,
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📚 Created courses");

    // Create folders
    const folders = await Promise.all(
      Array.from({ length: 5 }, () =>
        db
          .insert(schema.folders)
          .values({
            title: faker.lorem.words(2),
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📁 Created folders");

    // Create videos
    const videos = await Promise.all(
      Array.from({ length: 20 }, () =>
        db
          .insert(schema.videos)
          .values({
            videoLink: faker.internet.url(),
            videoType: faker.helpers.arrayElement(["YOUTUBE", "DRIVE", "ZOOM"]),
            timeStamps: JSON.stringify({
              "0:00": "Introduction",
              "5:30": "Main Content",
              "15:00": "Summary",
            }),
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("🎥 Created videos");

    // Create classes
    const classes = await Promise.all(
      videos.map((video) =>
        db
          .insert(schema.classes)
          .values({
            title: faker.lorem.words(3),
            videoId: video.id,
            courseId: faker.helpers.arrayElement(courses).id,
            folderId: faker.helpers.arrayElement(folders).id,
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📖 Created classes");

    // Create attendance records
    await Promise.all(
      classes.flatMap((class_) =>
        users
          .filter((u) => u.role === "STUDENT")
          .map((student) =>
            db.insert(schema.attendance).values({
              userId: student.id,
              classId: class_.id,
              attendedDuration: faker.number.int({ min: 0, max: 60 }),
              attended: faker.datatype.boolean(),
              data: [faker.lorem.sentence(), faker.lorem.sentence()],
            }),
          ),
      ),
    );

    console.log("✅ Created attendance records");

    // Create attachments
    const attachments = await Promise.all(
      Array.from({ length: 20 }, () =>
        db
          .insert(schema.attachments)
          .values({
            title: faker.lorem.words(2),
            details: faker.lorem.paragraph(),
            attachmentType: faker.helpers.arrayElement([
              "ASSIGNMENT",
              "GITHUB",
              "ZOOM",
              "OTHERS",
            ]),
            link: faker.internet.url(),
            maxSubmissions: faker.number.int({ min: 1, max: 3 }),
            classId: faker.helpers.arrayElement(classes).id,
            courseId: faker.helpers.arrayElement(courses).id,
            submissionMode: faker.helpers.arrayElement([
              "HTML_CSS_JS",
              "REACT",
              "EXTERNAL_LINK",
            ]),
            dueDate: faker.date.future(),
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📎 Created attachments");

    // Create enrolled users
    const students = users.filter((u) => u.role === "STUDENT");
    const mentors = users.filter((u) => u.role === "MENTOR");
    const enrolledUsers = await Promise.all(
      courses.flatMap((course) =>
        students.map((student) =>
          db
            .insert(schema.enrolledUsers)
            .values({
              userId: student.id,
              courseId: course.id,
              mentorId: faker.helpers.arrayElement(mentors).id,
              startDate: faker.date.past(),
              endDate: faker.date.future(),
            })
            .returning()
            .then((res) => res[0]!),
        ),
      ),
    );

    console.log("📝 Created enrollments");

    // Create submissions and points
    const submissions = await Promise.all(
      attachments.flatMap((attachment) =>
        enrolledUsers.map((enrolledUser) =>
          db
            .insert(schema.submissions)
            .values({
              enrolledUserId: enrolledUser.id,
              attachmentId: attachment.id,
              data: JSON.stringify({
                code: faker.lorem.paragraphs(),
                comments: faker.lorem.sentences(),
              }),
              submissionLink: faker.internet.url(),
              overallFeedback: faker.lorem.paragraph(),
            })
            .returning()
            .then((res) => res[0]!),
        ),
      ),
    );

    // Create points for submissions
    await Promise.all(
      submissions.flatMap((submission) =>
        ["RESPOSIVENESS", "STYLING", "OTHER"].map((category) =>
          db.insert(schema.points).values({
            category: category as any,
            feedback: faker.lorem.sentence(),
            score: faker.number.int({ min: 0, max: 10 }),
            submissionId: submission.id,
          }),
        ),
      ),
    );

    console.log("📨 Created submissions and points");

    // Create doubts
    const doubts = await Promise.all(
      Array.from({ length: 20 }, () =>
        db
          .insert(schema.doubts)
          .values({
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraphs(),
            userId: faker.helpers.arrayElement(students).id,
            courseId: faker.helpers.arrayElement(courses).id,
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("❓ Created doubts");

    // Create responses
    await Promise.all(
      doubts.flatMap((doubt) =>
        Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
          db.insert(schema.responses).values({
            description: faker.lorem.paragraphs(),
            userId: faker.helpers.arrayElement([...instructors, ...mentors]).id,
            doubtId: doubt.id,
          }),
        ),
      ),
    );

    console.log("✅ Created responses");

    // Create schedule events
    const events = await Promise.all(
      Array.from({ length: 20 }, () =>
        db
          .insert(schema.scheduleEvents)
          .values({
            title: faker.lorem.words(3),
            startTime: faker.date.future(),
            endTime: faker.date.future(),
            isPublished: faker.datatype.boolean(),
            courseId: faker.helpers.arrayElement(courses).id,
            createdById: faker.helpers.arrayElement(instructors).id,
          })
          .returning()
          .then((res) => res[0]!),
      ),
    );

    console.log("📅 Created schedule events");

    // Create event attachments
    await Promise.all(
      events.flatMap((event) =>
        Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
          db.insert(schema.eventAttachments).values({
            title: faker.lorem.words(2),
            type: faker.helpers.arrayElement([
              "YOUTUBE",
              "YOUTUBE_LIVE",
              "GMEET",
              "TEXT",
              "VIMEO",
              "VIDEOCRYPT",
              "DOCUMENT",
              "OTHER",
            ]),
            details: faker.lorem.paragraph(),
            link: faker.internet.url(),
            ordering: faker.number.int({ min: 1, max: 10 }),
            eventId: event.id,
          }),
        ),
      ),
    );

    console.log("📌 Created event attachments");

    // Create bookmarks
    await Promise.all(
      users.flatMap((user) =>
        Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
          db.insert(schema.bookmarks).values({
            category: faker.helpers.arrayElement([
              "ASSIGNMENT",
              "CLASS",
              "DOUBT",
              "NOTIFICATION",
            ]),
            objectId: faker.string.uuid(),
            causedObjects: JSON.stringify({
              relatedId: faker.string.uuid(),
              type: "ASSIGNMENT",
            }),
            userId: user.id,
          }),
        ),
      ),
    );

    console.log("🔖 Created bookmarks");

    // Create notes
    await Promise.all(
      users.flatMap((user) =>
        Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
          db.insert(schema.notes).values({
            userId: user.id,
            category: faker.helpers.arrayElement([
              "CLASS",
              "ASSIGNMENT",
              "DOUBT",
            ]),
            objectId: faker.string.uuid(),
            causedObjects: JSON.stringify({
              relatedId: faker.string.uuid(),
              type: "CLASS",
            }),
            description: faker.lorem.paragraphs(),
            tags: Array.from(
              { length: faker.number.int({ min: 1, max: 3 }) },
              () => faker.lorem.word(),
            ),
          }),
        ),
      ),
    );

    console.log("📝 Created notes");

    console.log("✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
