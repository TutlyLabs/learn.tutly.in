DO $$ BEGIN
 CREATE TYPE "public"."attachment_type" AS ENUM('ASSIGNMENT', 'GITHUB', 'ZOOM', 'OTHERS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bookmark_category" AS ENUM('ASSIGNMENT', 'CLASS', 'DOUBT', 'NOTIFICATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_attachment_type" AS ENUM('YOUTUBE', 'YOUTUBE_LIVE', 'GMEET', 'JIOMEET', 'TEXT', 'VIMEO', 'VIDEOCRYPT', 'DOCUMENT', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."file_type" AS ENUM('AVATAR', 'ATTACHMENT', 'NOTES', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."note_category" AS ENUM('CLASS', 'ASSIGNMENT', 'DOUBT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_event" AS ENUM('CLASS_CREATED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_REVIEWED', 'LEADERBOARD_UPDATED', 'DOUBT_RESPONDED', 'ATTENDANCE_MISSED', 'CUSTOM_MESSAGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_medium" AS ENUM('PUSH', 'NOTIFICATION', 'EMAIL', 'WHATSAPP', 'SMS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."point_category" AS ENUM('RESPOSIVENESS', 'STYLING', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('INSTRUCTOR', 'MENTOR', 'STUDENT', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_mode" AS ENUM('HTML_CSS_JS', 'REACT', 'EXTERNAL_LINK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."video_type" AS ENUM('DRIVE', 'YOUTUBE', 'ZOOM');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "tutly_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_attachment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT 'Attachment',
	"details" text,
	"attachment_type" "attachment_type" NOT NULL,
	"link" varchar(255),
	"max_submissions" integer DEFAULT 1,
	"class_id" varchar(255),
	"course_id" varchar(255),
	"submission_mode" "submission_mode" DEFAULT 'HTML_CSS_JS',
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_attendance" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"class_id" varchar(255) NOT NULL,
	"attended_duration" integer,
	"attended" boolean DEFAULT false,
	"data" text[],
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_bookmarks" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"category" "bookmark_category" NOT NULL,
	"object_id" varchar(255) NOT NULL,
	"caused_objects" text DEFAULT '{}',
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_class" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT 'class',
	"video_id" varchar(255) NOT NULL,
	"course_id" varchar(255),
	"folder_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_course" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"image" varchar(255),
	"start_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"end_date" timestamp with time zone,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_doubt" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"description" text,
	"user_id" varchar(255) NOT NULL,
	"course_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_enrolled_users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"mentorId" varchar(255),
	"start_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"end_date" timestamp with time zone,
	"course_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_event_attachment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "event_attachment_type" NOT NULL,
	"details" text,
	"link" varchar(255),
	"ordering" integer DEFAULT 1,
	"event_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_file" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"internal_name" varchar(255) NOT NULL,
	"associating_id" varchar(255),
	"file_type" "file_type" DEFAULT 'OTHER',
	"is_public" boolean DEFAULT false,
	"public_url" varchar(255),
	"is_uploaded" boolean DEFAULT false,
	"uploaded_by_id" varchar(255),
	"is_archived" boolean DEFAULT false,
	"archived_by_id" varchar(255),
	"archive_reason" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_folder" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT 'Folder',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_notes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"category" "note_category" NOT NULL,
	"object_id" varchar(255) NOT NULL,
	"caused_objects" text DEFAULT '{}',
	"description" text,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_notification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"intended_for_id" varchar(255) NOT NULL,
	"medium_sent" "notification_medium" DEFAULT 'PUSH',
	"custom_link" varchar(255),
	"caused_by_id" varchar(255),
	"event_type" "notification_event" NOT NULL,
	"message" text,
	"caused_objects" text DEFAULT '{}',
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_organization" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"org_code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "tutly_organization_org_code_unique" UNIQUE("org_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_point" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"category" "point_category" NOT NULL,
	"feedback" text,
	"score" integer DEFAULT 0,
	"submission_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_profile" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "tutly_profile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"date_of_birth" timestamp with time zone,
	"hobbies" text[],
	"about_me" text,
	"secondary_email" varchar(255),
	"mobile" varchar(255),
	"whatsapp" varchar(255),
	"gender" varchar(255),
	"tshirt_size" varchar(255),
	"social_links" text DEFAULT '{}',
	"professional_profiles" text DEFAULT '{}',
	"academic_details" text DEFAULT '{}',
	"experiences" text[],
	"address" text DEFAULT '{}',
	"documents" text DEFAULT '{}',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tutly_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_push_subscription" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"p256dh" varchar(255) NOT NULL,
	"auth" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tutly_push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_response" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"description" text,
	"user_id" varchar(255) NOT NULL,
	"doubt_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_schedule_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_published" boolean DEFAULT false,
	"course_id" varchar(255),
	"created_by_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_submission" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"enrolled_user_id" varchar(255) NOT NULL,
	"attachment_id" varchar(255) NOT NULL,
	"data" text DEFAULT '{}',
	"overall_feedback" text,
	"edit_time" timestamp with time zone DEFAULT (NOW() + '15 minutes'::interval) NOT NULL,
	"submission_link" varchar(255),
	"submission_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"role" "role" DEFAULT 'STUDENT',
	"username" varchar(255) NOT NULL,
	"password" varchar(255),
	"organization_id" varchar(255) NOT NULL,
	"last_seen" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "tutly_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutly_video" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"video_link" varchar(255),
	"video_type" "video_type" NOT NULL,
	"time_stamps" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_account" ADD CONSTRAINT "tutly_account_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_attachment" ADD CONSTRAINT "tutly_attachment_class_id_tutly_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."tutly_class"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_attachment" ADD CONSTRAINT "tutly_attachment_course_id_tutly_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tutly_course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_attendance" ADD CONSTRAINT "tutly_attendance_userId_tutly_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_attendance" ADD CONSTRAINT "tutly_attendance_class_id_tutly_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."tutly_class"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_bookmarks" ADD CONSTRAINT "tutly_bookmarks_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_class" ADD CONSTRAINT "tutly_class_video_id_tutly_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."tutly_video"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_class" ADD CONSTRAINT "tutly_class_course_id_tutly_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tutly_course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_class" ADD CONSTRAINT "tutly_class_folder_id_tutly_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."tutly_folder"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_course" ADD CONSTRAINT "tutly_course_created_by_id_tutly_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_doubt" ADD CONSTRAINT "tutly_doubt_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_doubt" ADD CONSTRAINT "tutly_doubt_course_id_tutly_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tutly_course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_enrolled_users" ADD CONSTRAINT "tutly_enrolled_users_userId_tutly_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_enrolled_users" ADD CONSTRAINT "tutly_enrolled_users_mentorId_tutly_user_id_fk" FOREIGN KEY ("mentorId") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_enrolled_users" ADD CONSTRAINT "tutly_enrolled_users_course_id_tutly_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tutly_course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_event_attachment" ADD CONSTRAINT "tutly_event_attachment_event_id_tutly_schedule_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."tutly_schedule_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_file" ADD CONSTRAINT "tutly_file_uploaded_by_id_tutly_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_file" ADD CONSTRAINT "tutly_file_archived_by_id_tutly_user_id_fk" FOREIGN KEY ("archived_by_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_notes" ADD CONSTRAINT "tutly_notes_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_notification" ADD CONSTRAINT "tutly_notification_intended_for_id_tutly_user_id_fk" FOREIGN KEY ("intended_for_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_notification" ADD CONSTRAINT "tutly_notification_caused_by_id_tutly_user_id_fk" FOREIGN KEY ("caused_by_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_point" ADD CONSTRAINT "tutly_point_submission_id_tutly_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."tutly_submission"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_profile" ADD CONSTRAINT "tutly_profile_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_push_subscription" ADD CONSTRAINT "tutly_push_subscription_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_response" ADD CONSTRAINT "tutly_response_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_response" ADD CONSTRAINT "tutly_response_doubt_id_tutly_doubt_id_fk" FOREIGN KEY ("doubt_id") REFERENCES "public"."tutly_doubt"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_schedule_event" ADD CONSTRAINT "tutly_schedule_event_course_id_tutly_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tutly_course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_schedule_event" ADD CONSTRAINT "tutly_schedule_event_created_by_id_tutly_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_session" ADD CONSTRAINT "tutly_session_user_id_tutly_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tutly_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_submission" ADD CONSTRAINT "tutly_submission_enrolled_user_id_tutly_enrolled_users_id_fk" FOREIGN KEY ("enrolled_user_id") REFERENCES "public"."tutly_enrolled_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_submission" ADD CONSTRAINT "tutly_submission_attachment_id_tutly_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."tutly_attachment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutly_user" ADD CONSTRAINT "tutly_user_organization_id_tutly_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."tutly_organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "tutly_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_attendance" ON "tutly_attendance" USING btree ("userId","class_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_object" ON "tutly_bookmarks" USING btree ("user_id","object_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_enrollment" ON "tutly_enrolled_users" USING btree ("userId","course_id","mentorId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_note_object" ON "tutly_notes" USING btree ("user_id","object_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_code_idx" ON "tutly_organization" USING btree ("org_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_submission_category" ON "tutly_point" USING btree ("submission_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "tutly_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_organization_username" ON "tutly_user" USING btree ("organization_id","username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_organization_email" ON "tutly_user" USING btree ("organization_id","email");