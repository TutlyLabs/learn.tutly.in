import { ActionError } from "astro:actions";
import bcrypt from "bcrypt";

import db from "@/lib/db";
import { generateRandomPassword } from "@/lib/db";

async function validateCredentials(identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toUpperCase() };

  const user = await db.user.findFirst({
    where: query,
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      oneTimePassword: true,
      name: true,
      image: true,
      role: true,
      organization: true,
      disabledAt: true,
    },
  });

  if (!user) {
    throw new Error(isEmail ? "Email not found" : "Username not found");
  }

  if (user.disabledAt) {
    throw new Error("This account has been disabled. Please contact your instructor.");
  }

  if (password === user.oneTimePassword) {
    await db.user.update({
      where: { id: user.id },
      data: {
        oneTimePassword: generateRandomPassword(8),
      },
    });
    return { user, isOneTimePassword: true };
  }

  if (!user.password) {
    throw new Error("Password not set for this account");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }

  return { user, isOneTimePassword: false };
}

export async function signInWithCredentials(
  identifier: string,
  password: string,
  userAgent?: string | null
) {
  try {
    const { user, isOneTimePassword } = await validateCredentials(identifier, password);

    const session = await db.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent || "Unknown Device",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      },
      include: {
        user: {
          include: {
            organization: true,
            profile: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("Failed to create session");
    }

    return {
      sessionId: session.id,
      user: session.user,
      isPasswordSet: !!user.password && !isOneTimePassword, // password is set and not using oneTimePassword
    };
  } catch (error) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}
