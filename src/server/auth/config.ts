import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import bcryptjs from "bcryptjs";

import { db } from "~/server/db";
import {
  accounts,
  type roleEnum,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      organizationId: string;
      role: (typeof roleEnum.enumValues)[number];
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: (users) => eq(users.username, username.trim().toUpperCase()),
        });

        if (!user) {
          throw new Error("Invalid username or password");
        }

        if (!user.password) {
          throw new Error("Please login with Google");
        }

        const valid = await bcryptjs.compare(password, user.password);

        if (!valid) {
          throw new Error("Invalid username or password");
        }

        return user;
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async signIn({ user, account }) {
      try {
        const email = user.email;
        if (typeof email !== "string") {
          console.error("No email provided by authentication provider");
          return false;
        }

        if (account?.provider === "google") {
          const username = email.split("@")[0]?.toUpperCase();
          if (!username) {
            console.error("Could not generate username from email");
            return false;
          }

          const existingUser = await db.transaction(async (tx) => {
            // First try to find by email for account linking
            let userRecord = await tx.query.users.findFirst({
              where: (users) => eq(users.email, email.toLowerCase()),
            });

            // If no user found by email, try username
            if (!userRecord) {
              userRecord = await tx.query.users.findFirst({
                where: (users) => eq(users.username, username),
              });
            }

            if (userRecord) {
              // Update existing user's details
              await tx
                .update(users)
                .set({
                  email: email.toLowerCase(),
                  image: user.image ?? userRecord.image, // Preserve existing one
                  name: user.name ?? userRecord.name,
                  emailVerified: new Date(),
                })
                .where(eq(users.id, userRecord.id));

              return userRecord;
            }

            // Create new user if doesn't exist
            const newUser = await tx
              .insert(users)
              .values({
                id: crypto.randomUUID(),
                username,
                email: email.toLowerCase(),
                name: user.name ?? username, // Fallback to username if name not provided
                image: user.image ?? null,
                emailVerified: new Date(),
                role: "STUDENT",
                organizationId: "58918943-51f2-4bc4-9c2a-cbea796c2577",
              })
              .returning();

            return newUser[0];
          });

          return !!existingUser;
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        organizationId: session.user.organizationId,
        role: session.user.role,
      },
    }),
  },
} satisfies NextAuthConfig;
