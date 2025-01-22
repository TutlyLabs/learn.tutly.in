import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `tutly_${name}`);

// ==============================
// Enums
// ==============================
export const roleEnum = pgEnum("role", [
  "INSTRUCTOR",
  "MENTOR",
  "STUDENT",
  "ADMIN",
]);
export const fileTypeEnum = pgEnum("file_type", [
  "AVATAR",
  "ATTACHMENT",
  "NOTES",
  "OTHER",
]);
export const notificationMediumEnum = pgEnum("notification_medium", [
  "PUSH",
  "NOTIFICATION",
  "EMAIL",
  "WHATSAPP",
  "SMS",
]);
export const notificationEventEnum = pgEnum("notification_event", [
  "CLASS_CREATED",
  "ASSIGNMENT_CREATED",
  "ASSIGNMENT_REVIEWED",
  "LEADERBOARD_UPDATED",
  "DOUBT_RESPONDED",
  "ATTENDANCE_MISSED",
  "CUSTOM_MESSAGE",
]);
export const bookmarkCategoryEnum = pgEnum("bookmark_category", [
  "ASSIGNMENT",
  "CLASS",
  "DOUBT",
  "NOTIFICATION",
]);
export const noteCategoryEnum = pgEnum("note_category", [
  "CLASS",
  "ASSIGNMENT",
  "DOUBT",
]);
export const videoTypeEnum = pgEnum("video_type", ["DRIVE", "YOUTUBE", "ZOOM"]);
export const attachmentTypeEnum = pgEnum("attachment_type", [
  "ASSIGNMENT",
  "GITHUB",
  "ZOOM",
  "OTHERS",
]);
export const submissionModeEnum = pgEnum("submission_mode", [
  "HTML_CSS_JS",
  "REACT",
  "EXTERNAL_LINK",
]);
export const pointCategoryEnum = pgEnum("point_category", [
  "RESPOSIVENESS",
  "STYLING",
  "OTHER",
]);
export const eventAttachmentTypeEnum = pgEnum("event_attachment_type", [
  "YOUTUBE",
  "YOUTUBE_LIVE",
  "GMEET",
  "JIOMEET",
  "TEXT",
  "VIMEO",
  "VIDEOCRYPT",
  "DOCUMENT",
  "OTHER",
]);

// ==============================
// Organization Related Tables
// ==============================
export const organizations = createTable(
  "organization",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orgCode: varchar("org_code", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (organization) => ({
    orgCodeIdx: index("org_code_idx").on(organization.orgCode),
  }),
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

// ==============================
// User Related Tables
// ==============================
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  role: roleEnum("role").default("STUDENT"),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }),
  organizationId: varchar("organization_id", { length: 255 })
    .references(() => organizations.id)
    .notNull(),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
},
  (user) => ({
    uniqueOrganizationUsername: uniqueIndex("unique_organization_username").on(
      user.organizationId,
      user.username,
    ),
    uniqueOrganizationEmail: uniqueIndex("unique_organization_email").on(
      user.organizationId,
      user.email,
    ),
  }));

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  profile: one(profiles),
  files: many(files, { relationName: "uploadedFiles" }),
  archivedFiles: many(files, { relationName: "archivedFiles" }),
  pushSubscriptions: many(pushSubscriptions),
  notificationsFor: many(notifications, {
    relationName: "notificationIntendedFor",
  }),
  notificationsCaused: many(notifications, {
    relationName: "notificationCausedBy",
  }),
  bookmarks: many(bookmarks),
  notes: many(notes),
  courses: many(courses),
  doubts: many(doubts),
  responses: many(responses),
  scheduleEvents: many(scheduleEvents),
}));

export const profiles = createTable("profile", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id)
    .unique(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  hobbies: text("hobbies").array(),
  aboutMe: text("about_me"),
  secondaryEmail: varchar("secondary_email", { length: 255 }),
  mobile: varchar("mobile", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 255 }),
  gender: varchar("gender", { length: 255 }),
  tshirtSize: varchar("tshirt_size", { length: 255 }),

  // Social Links: {"facebook": null, "linkedin": null, "twitter": null, "quora": null, "website": null}
  socialLinks: text("social_links").default("{}"),

  // Professional Profiles: {"github": null, "leetcode": null, "codechef": null, "codeforces": null, "hackerrank": null}
  professionalProfiles: text("professional_profiles").default("{}"),

  // Academic Details: {"rollNumber": null, "cgpa": null, "marks": null, "grade": null, "percentage": null, "section": null, "branch": null, "academicYear": null}
  academicDetails: text("academic_details").default("{}"),

  // Experience: [{"company": null, "role": null, "workLocation": null, "workCity": null, "startDate": null, "endDate": null}]
  experiences: text("experiences").array(),

  // Address: {"building": null, "street": null, "city": null, "state": null, "country": null, "pincode": null}
  address: text("address").default("{}"),

  // Documents: {"resume": null}
  documents: text("documents").default("{}"),

  // Additional Metadata for Future Extensions
  metadata: text("metadata").default("{}"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

// ==============================
// Authentication Related Tables
// ==============================
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ==============================
// File Related Tables
// ==============================
export const files = createTable("file", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  internalName: varchar("internal_name", { length: 255 }).notNull(),
  associatingId: varchar("associating_id", { length: 255 }),
  fileType: fileTypeEnum("file_type").default("OTHER"),
  isPublic: boolean("is_public").default(false),
  publicUrl: varchar("public_url", { length: 255 }),
  isUploaded: boolean("is_uploaded").default(false),
  uploadedById: varchar("uploaded_by_id", { length: 255 }).references(
    () => users.id,
  ),
  isArchived: boolean("is_archived").default(false),
  archivedById: varchar("archived_by_id", { length: 255 }).references(
    () => users.id,
  ),
  archiveReason: text("archive_reason"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
    relationName: "uploadedFiles",
  }),
  archivedBy: one(users, {
    fields: [files.archivedById],
    references: [users.id],
    relationName: "archivedFiles",
  }),
}));

// ==============================
// Notification Related Tables
// ==============================
export const pushSubscriptions = createTable("push_subscription", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  endpoint: varchar("endpoint", { length: 255 }).notNull().unique(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  }),
);

export const notifications = createTable("notification", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  intendedForId: varchar("intended_for_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  mediumSent: notificationMediumEnum("medium_sent").default("PUSH"),
  customLink: varchar("custom_link", { length: 255 }),
  causedById: varchar("caused_by_id", { length: 255 }).references(
    () => users.id,
  ),
  eventType: notificationEventEnum("event_type").notNull(),
  message: text("message"),
  causedObjects: text("caused_objects").default("{}"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  intendedFor: one(users, {
    fields: [notifications.intendedForId],
    references: [users.id],
    relationName: "notificationIntendedFor",
  }),
  causedBy: one(users, {
    fields: [notifications.causedById],
    references: [users.id],
    relationName: "notificationCausedBy",
  }),
}));

// ==============================
// Course Related Tables
// ==============================
export const courses = createTable("course", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  startDate: timestamp("start_date", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const coursesRelations = relations(courses, ({ many, one }) => ({
  createdBy: one(users, {
    fields: [courses.createdById],
    references: [users.id],
  }),
  enrolledUsers: many(enrolledUsers),
  classes: many(classes),
  attachments: many(attachments),
  doubts: many(doubts),
  scheduleEvents: many(scheduleEvents),
}));

// ==============================
// Video and Folder Tables
// ==============================
export const videos = createTable("video", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  videoLink: varchar("video_link", { length: 255 }),
  videoType: videoTypeEnum("video_type").notNull(),
  timeStamps: text("time_stamps").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const folders = createTable("folder", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).default("Folder"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// ==============================
// Class Related Tables
// ==============================
export const classes = createTable("class", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).default("class"),
  videoId: varchar("video_id", { length: 255 })
    .notNull()
    .references(() => videos.id),
  courseId: varchar("course_id", { length: 255 }).references(() => courses.id),
  folderId: varchar("folder_id", { length: 255 }).references(() => folders.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const classesRelations = relations(classes, ({ one, many }) => ({
  video: one(videos, { fields: [classes.videoId], references: [videos.id] }),
  course: one(courses, {
    fields: [classes.courseId],
    references: [courses.id],
  }),
  folder: one(folders, {
    fields: [classes.folderId],
    references: [folders.id],
  }),
  attachments: many(attachments),
  attendance: many(attendance),
}));

// ==============================
// Enrollment Related Tables
// ==============================
export const enrolledUsers = createTable(
  "enrolled_users",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    mentorId: varchar("mentorId", { length: 255 })
      .references(() => users.id),
    startDate: timestamp("start_date", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    courseId: varchar("course_id", { length: 255 }).references(
      () => courses.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (enrolledUser) => ({
    uniqueEnrollment: uniqueIndex("unique_enrollment").on(
      enrolledUser.userId,
      enrolledUser.courseId,
      enrolledUser.mentorId,
    ),
  }),
);

export const enrolledUsersRelations = relations(
  enrolledUsers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [enrolledUsers.userId],
      references: [users.id],
    }),
    mentor: one(users, {
      fields: [enrolledUsers.mentorId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [enrolledUsers.courseId],
      references: [courses.id],
    }),
    submissions: many(submissions),
  }),
);

export const attendance = createTable(
  "attendance",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    classId: varchar("class_id", { length: 255 })
      .notNull()
      .references(() => classes.id),
    attendedDuration: integer("attended_duration"),
    attended: boolean("attended").default(false),
    data: text("data").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (attendance) => ({
    uniqueAttendance: uniqueIndex("unique_attendance").on(
      attendance.userId,
      attendance.classId,
    ),
  }),
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
}));

// ==============================
// Attachments and Submissions
// ==============================
export const attachments = createTable("attachment", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).default("Attachment"),
  details: text("details"),
  attachmentType: attachmentTypeEnum("attachment_type").notNull(),
  link: varchar("link", { length: 255 }),
  maxSubmissions: integer("max_submissions").default(1),
  classId: varchar("class_id", { length: 255 }).references(() => classes.id),
  courseId: varchar("course_id", { length: 255 }).references(() => courses.id),
  submissionMode: submissionModeEnum("submission_mode").default("HTML_CSS_JS"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const attachmentsRelations = relations(attachments, ({ one, many }) => ({
  class: one(classes, {
    fields: [attachments.classId],
    references: [classes.id],
  }),
  course: one(courses, {
    fields: [attachments.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
}));

export const submissions = createTable("submission", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  enrolledUserId: varchar("enrolled_user_id", { length: 255 })
    .notNull()
    .references(() => enrolledUsers.id),
  attachmentId: varchar("attachment_id", { length: 255 })
    .notNull()
    .references(() => attachments.id),
  data: text("data").default("{}"),
  overallFeedback: text("overall_feedback"),
  editTime: timestamp("edit_time", { withTimezone: true })
    .default(sql`(NOW() + '15 minutes'::interval)`)
    .notNull(),
  submissionLink: varchar("submission_link", { length: 255 }),
  submissionDate: timestamp("submission_date", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  enrolledUser: one(enrolledUsers, {
    fields: [submissions.enrolledUserId],
    references: [enrolledUsers.id],
  }),
  attachment: one(attachments, {
    fields: [submissions.attachmentId],
    references: [attachments.id],
  }),
  points: many(points),
}));

export const points = createTable(
  "point",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    category: pointCategoryEnum("category").notNull(),
    feedback: text("feedback"),
    score: integer("score").default(0),
    submissionId: varchar("submission_id", { length: 255 }).references(
      () => submissions.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (point) => ({
    uniqueSubmissionCategory: uniqueIndex("unique_submission_category").on(
      point.submissionId,
      point.category,
    ),
  }),
);

export const pointsRelations = relations(points, ({ one }) => ({
  submission: one(submissions, {
    fields: [points.submissionId],
    references: [submissions.id],
  }),
}));

// ==============================
// Doubts and Responses
// ==============================
export const doubts = createTable("doubt", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  courseId: varchar("course_id", { length: 255 }).references(() => courses.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const doubtsRelations = relations(doubts, ({ one, many }) => ({
  user: one(users, { fields: [doubts.userId], references: [users.id] }),
  course: one(courses, { fields: [doubts.courseId], references: [courses.id] }),
  responses: many(responses),
}));

export const responses = createTable("response", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  description: text("description"),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  doubtId: varchar("doubt_id", { length: 255 })
    .notNull()
    .references(() => doubts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const responsesRelations = relations(responses, ({ one }) => ({
  user: one(users, { fields: [responses.userId], references: [users.id] }),
  doubt: one(doubts, { fields: [responses.doubtId], references: [doubts.id] }),
}));

// ==============================
// Events Related Tables
// ==============================
export const scheduleEvents = createTable("schedule_event", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isPublished: boolean("is_published").default(false),
  courseId: varchar("course_id", { length: 255 }).references(() => courses.id),
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const scheduleEventsRelations = relations(
  scheduleEvents,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [scheduleEvents.courseId],
      references: [courses.id],
    }),
    createdBy: one(users, {
      fields: [scheduleEvents.createdById],
      references: [users.id],
    }),
    attachments: many(eventAttachments),
  }),
);

export const eventAttachments = createTable("event_attachment", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  type: eventAttachmentTypeEnum("type").notNull(),
  details: text("details"),
  link: varchar("link", { length: 255 }),
  ordering: integer("ordering").default(1),
  eventId: varchar("event_id", { length: 255 })
    .notNull()
    .references(() => scheduleEvents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const eventAttachmentsRelations = relations(
  eventAttachments,
  ({ one }) => ({
    event: one(scheduleEvents, {
      fields: [eventAttachments.eventId],
      references: [scheduleEvents.id],
    }),
  }),
);

// ==============================
// Bookmarks and Notes Tables
// ==============================
export const bookmarks = createTable(
  "bookmarks",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    category: bookmarkCategoryEnum("category").notNull(),
    objectId: varchar("object_id", { length: 255 }).notNull(),
    causedObjects: text("caused_objects").default("{}"),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (bookmark) => ({
    uniqueUserObject: uniqueIndex("unique_user_object").on(
      bookmark.userId,
      bookmark.objectId,
    ),
  }),
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const notes = createTable(
  "notes",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    category: noteCategoryEnum("category").notNull(),
    objectId: varchar("object_id", { length: 255 }).notNull(),
    causedObjects: text("caused_objects").default("{}"),
    description: text("description"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (note) => ({
    uniqueUserObject: uniqueIndex("unique_user_note_object").on(
      note.userId,
      note.objectId,
    ),
  }),
);

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
}));
