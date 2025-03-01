import type { Session } from "@prisma/client";

import db from "../db";
import { UserSession } from "./core/session";

export * from "./core/session";

// Re-export the session types for global use
export type { UserSession as SessionUser };

export type SessionWithUser = Session & {
  user: UserSession;
};

export type SessionValidationResult = {
  session: SessionWithUser | null;
  user: UserSession | null;
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

    return { session: session, user: session.user };
  } catch (error) {
    console.error("[Session] Error validating session:", error);
    return { session: null, user: null };
  }
}
