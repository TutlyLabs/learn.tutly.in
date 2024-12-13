import type { OAuth2Tokens } from "arctic";
import { ActionError } from "astro:actions";

import db from "@/lib/db";

import type { OAuthUser } from ".";

// import bcrypt from "bcrypt";

class CredentialsTokens implements OAuth2Tokens {
  private expiresAt: Date;
  private tokenId: string;

  constructor(private userId: string) {
    this.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    this.tokenId = `cred_${userId}_${Date.now()}`;
  }

  accessToken() {
    return this.userId;
  }
  refreshToken() {
    return this.userId;
  }
  accessTokenExpiresAt() {
    return this.expiresAt;
  }
  refreshTokenExpiresAt() {
    return this.expiresAt;
  }

  tokenType() {
    return "Bearer";
  }
  accessTokenExpiresInSeconds() {
    return 86400;
  }
  hasRefreshToken() {
    return true;
  }
  isExpired() {
    return Date.now() > this.expiresAt.getTime();
  }

  hasScopes() {
    return true;
  }
  scopes() {
    return ["*"];
  }
  idToken() {
    return this.tokenId;
  }

  data = {};
}

async function validateCredentials(email: string, password: string) {
  const isEmail = email.includes("@");

  const user = await db.user.findFirst({
    where: isEmail ? { email: email.toLowerCase() } : { username: email.toUpperCase() },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // todo:change it to bcrypt

  // if (!user.password || !bcrypt.compareSync(password, user.password)) {
  //   throw new Error("Invalid credentials");
  // }

  if (user.password !== password) {
    throw new Error("Invalid credentials");
  }

  return user;
}

// Main sign in function
export async function signInWithCredentials(
  email: string,
  password: string,
  userAgent?: string | null
) {
  try {
    const user = await validateCredentials(email, password);

    // Create session
    const session = await db.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent || "Unknown Device",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      },
      select: {
        id: true,
        user: true,
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

// Provider interface implementation
export function createAuthorizationURL(url?: URL) {
  return {
    state: "credentials",
    codeVerifier: "credentials",
    redirectUrl: new URL("/sign-in", url || "http://localhost:4321"),
  };
}

export async function validateAuthorizationCode(
  code: string,
  _codeVerifier?: string
): Promise<OAuth2Tokens> {
  if (!code) {
    throw new Error("Invalid authorization code");
  }

  const [email, password] = code.split(":");
  if (!email || !password) {
    throw new Error("Invalid credentials format");
  }

  const user = await validateCredentials(email, password);
  return new CredentialsTokens(user.id);
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens> {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }
  return new CredentialsTokens(refreshToken);
}

export async function revokeAccessToken(_token: string): Promise<void> {
  // No-op for credentials
  return;
}

export async function fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser | null> {
  const userId = tokens.accessToken();
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email || "",
    avatar_url: user.image || "",
  };
}
