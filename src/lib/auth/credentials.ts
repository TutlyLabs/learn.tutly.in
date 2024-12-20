import type { OAuth2Tokens } from "arctic";
import { ActionError } from "astro:actions";
import bcrypt from "bcrypt";

import db from "@/lib/db";

import type { OAuthUser } from ".";

async function validateCredentials(identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };

  const user = await db.user.findFirst({
    where: query,
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      name: true,
      image: true,
      role: true,
      organization: true,
    },
  });

  if (!user) {
    throw new Error(isEmail ? "Email not found" : "Username not found");
  }

  if (!user.password) {
    throw new Error("Password not set for this account");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }

  return user;
}

export async function signInWithCredentials(
  identifier: string,
  password: string,
  userAgent?: string | null
) {
  try {
    const user = await validateCredentials(identifier, password);

    const session = await db.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent || "Unknown Device",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
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
    };
  } catch (error) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}

export function createAuthorizationURL(url?: URL) {
  return {
    state: "credentials",
    codeVerifier: "credentials",
    redirectUrl: new URL("/sign-in", url || "http://localhost:4321"),
  };
}

export async function validateAuthorizationCode(code: string): Promise<OAuth2Tokens> {
  const [email, password] = code.split(":");
  if (!email || !password) {
    throw new Error("Invalid credentials format");
  }

  const user = await validateCredentials(email, password);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  return {
    accessToken: () => user.id,
    refreshToken: () => user.id,
    accessTokenExpiresAt: () => expiresAt,
    tokenType: () => "Bearer",
    accessTokenExpiresInSeconds: () => 86400,
    hasRefreshToken: () => true,
    hasScopes: () => true,
    scopes: () => ["*"],
    idToken: () => `cred_${user.id}`,
    data: {},
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens> {
  return validateAuthorizationCode(refreshToken);
}

export async function revokeAccessToken(_token: string): Promise<void> {
  return;
}

export async function fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser> {
  const userId = tokens.accessToken();
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    email: user.email || "",
    avatar_url: user.image || "",
    providerAccountId: userId,
  };
}
