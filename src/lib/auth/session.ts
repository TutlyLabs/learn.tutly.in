import type { Course, Organization, Role, Session, User } from "@prisma/client";

import db from "../db";

export type SessionUser = Omit<User, "password" | "oneTimePassword"> & {
  organization: Organization | null;
  role: Role;
  adminForCourses: Course[];
};

export type SessionWithUser = Session & {
  user: SessionUser;
};

export type SessionValidationResult = {
  session: SessionWithUser | null;
  user: SessionUser | null;
};

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  try {
    const session = await db.session.findUnique({
      where: { id: token },
      include: {
        user: {
          include: {
            organization: true,
            profile: true,
            adminForCourses: true,
          },
        },
      },
    });

    if (!session?.user) {
      return { session: null, user: null };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });

    if (Date.now() >= session.expiresAt.getTime()) {
      await db.session.delete({ where: { id: token } });
      return { session: null, user: null };
    }

    return { session: session as SessionWithUser, user: session.user as SessionUser };
  } catch (error) {
    console.error("[Session] Error validating session:", error);
    return { session: null, user: null };
  },

}
