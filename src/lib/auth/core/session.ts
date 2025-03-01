import { Role } from "@prisma/client";
import crypto from "crypto";
import { z } from "zod";

import db from "@/lib/db";

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_SESSION_KEY = "app_auth_token";

export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  username: z.string(),
  image: z.string().nullable(),
  mobile: z.string().nullable(),
  role: z.nativeEnum(Role),
  organizationId: z.string().nullable(),
  lastSeen: z.date().nullable(),
  emailVerified: z.boolean().default(false),
  isProfilePublic: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    orgCode: z.string(),
  }).nullable(),
});

type UserSession = z.infer<typeof sessionSchema>;
export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
      path?: string;
      maxAge?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string, options?: { path?: string }) => void;
};

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  return getUserSessionById(sessionId);
}

export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return;

  await db.session.update({
    where: {
      id: sessionId,
      userId: user.id, // remove this
    },
    data: {
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    },
  });
}

export async function createUserSession(user: UserSession, cookies: Pick<Cookies, "set">) {
  const sessionId = crypto.randomBytes(512).toString("hex").normalize();
  await db.session.create({
    data: {
      id: sessionId,
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
      userId: user.id,
    },
  });

  setCookie(sessionId, cookies);
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, "get" | "set">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return;

  const user = await getUserSessionById(sessionId);
  if (user == null) return;

  await db.session.update({
    where: {
      id: sessionId,
      userId: user.id, // remove this
    },
    data: {
      expiresAt: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
    },
  });
  setCookie(sessionId, cookies);
}

export async function removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return;

  await db.session.delete({
    where: {
      id: sessionId,
    },
  });
  cookies.delete(COOKIE_SESSION_KEY, { path: "/" });
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRATION_SECONDS
  });
}

async function getUserSessionById(sessionId: string) {
  const session = await db.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!session?.user) return null;

  const { success, data: user } = sessionSchema.safeParse({
    ...session.user,
    organization: session.user.organization,
  });

  return success ? user : null;
}

export type { UserSession };
