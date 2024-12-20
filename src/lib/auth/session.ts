import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import type { Organization, Role, Session, User } from "@prisma/client";
import type { APIContext } from "astro";

import db from "../db";

export type SessionUser = Omit<User, "password" | "oneTimePassword"> & {
  organization: Organization | null;
  role: Role;
};

export type SessionWithUser = Session & {
  user: SessionUser;
};

export type SessionValidationResult = {
  session: SessionWithUser | null;
  user: SessionUser | null;
};

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  try {
    const session = await db.session.findUnique({
      where: { id: token },
      include: {
        user: {
          include: {
            organization: true,
            profile: true,
          },
        },
      },
    });

    if (!session?.user) {
      return { session: null, user: null };
    }

    if (Date.now() >= session.expiresAt.getTime()) {
      await db.session.delete({ where: { id: token } });
      return { session: null, user: null };
    }

    return { session: session as SessionWithUser, user: session.user as SessionUser };
  } catch (error) {
    console.error("[Session] Error validating session:", error);
    return { session: null, user: null };
  }
}

export function setSessionCookie(context: APIContext, token: string, expiresAt: Date) {
  context.cookies.set("session", token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export function deleteSessionCookie(context: APIContext) {
  context.cookies.delete("session", {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
  });
}
