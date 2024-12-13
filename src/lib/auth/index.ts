import type { OAuth2Tokens } from "arctic";

import db from "../db.ts";
import * as credentials from "./credentials.ts";
import * as github from "./github.ts";
import * as google from "./google.ts";

export type OAuthUser = {
  name: string;
  email: string;
  avatar_url: string;
};

export function tryOr<T, E>(fn: () => T, fallback: E | ((error: unknown) => E)): T | E {
  try {
    return fn();
  } catch (error) {
    if (typeof fallback === "function") {
      return (fallback as (error: unknown) => E)(error);
    }
    return fallback;
  }
}

interface Provider {
  createAuthorizationURL(
    url?: URL,
    codeverifier?: string
  ): { state: string; codeVerifier?: string; redirectUrl: URL };
  validateAuthorizationCode(code: string, codeverifier?: string, url?: URL): Promise<OAuth2Tokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens>;
  revokeAccessToken(token: string): void | Promise<void>;
  fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser | null>;
}

export const AUTH_SESSION_COOKIE = "sessionId";
export const AUTH_STATE_COOKIE = "authState";
export type AuthState = { state: string; codeVerifier?: string; from?: string };

export const providers = {
  credentials: credentials as Provider,
  github: github as Provider,
  google: google as Provider,
};
export type ProviderKey = keyof typeof providers;

export function extractDeviceLabel(userAgent: string) {
  let label = ""; // Browser - OS - Device
  // extract the browser
  if (userAgent.includes("Edg")) {
    label += "Edge";
  } else if (userAgent.includes("Chrome")) {
    label += "Chrome";
  } else if (userAgent.includes("Firefox")) {
    label += "Firefox";
  } else if (userAgent.includes("Safari")) {
    label += "Safari";
  } else if (userAgent.includes("Opera")) {
    label += "Opera";
  } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
    label += "IE";
  } else {
    label += "Other";
  }

  label += " - ";

  // extract the OS
  if (userAgent.includes("Windows")) {
    label += "Windows";
  } else if (userAgent.includes("Macintosh")) {
    label += "Mac";
  } else if (userAgent.includes("Linux")) {
    label += "Linux";
  } else if (userAgent.includes("Android")) {
    label += "Android";
  } else if (userAgent.includes("iOS")) {
    label += "iOS";
  } else {
    label += "Other";
  }

  label += " - ";

  // extract the device
  if (userAgent.includes("Mobile")) {
    label += "Mobile";
  } else if (userAgent.includes("Tablet")) {
    label += "Tablet";
  } else {
    label += "Desktop";
  }

  return label || "Unknown Device";
}

export async function findOrCreateUser(
  provider: ProviderKey,
  userInfo: OAuthUser,
  providerAccountId: string
) {
  try {
    // First try to find existing account with this provider
    const existingAccount = await db.account.findFirst({
      where: {
        provider,
        providerAccountId,
      },
      include: {
        user: true,
      },
    });

    // If account exists, return the linked user
    if (existingAccount) {
      return existingAccount.user;
    }

    // No account exists, try to find user by email
    const existingUser = userInfo.email
      ? await db.user.findFirst({
          where: {
            email: userInfo.email,
          },
        })
      : null;

    if (existingUser) {
      // User exists but not linked to this provider - return user for linking
      return existingUser;
    }

    // Create new user if none exists
    return await db.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.avatar_url,
        username: userInfo.email?.split("@")[0]?.toUpperCase() || "",
      },
    });
  } catch (error) {
    console.error("Error finding/creating user:", error);
    return null;
  }
}

export async function linkAccounts(
  userId: string,
  provider: ProviderKey,
  tokens: OAuth2Tokens,
  providerAccountId: string
) {
  try {
    // Check if this provider account is already linked to any user
    const existingAccount = await db.account.findFirst({
      where: {
        provider,
        providerAccountId,
      },
    });

    if (existingAccount) {
      if (existingAccount.userId === userId) {
        // Update existing account tokens
        return await db.account.update({
          where: { id: existingAccount.id },
          data: {
            access_token: tokens.accessToken(),
            expires_at: tokens.accessTokenExpiresAt()
              ? Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000)
              : null,
            refresh_token: tryOr(tokens.refreshToken, null),
          },
        });
      } else {
        // Provider account already linked to different user
        throw new Error("Provider account already linked to different user");
      }
    }

    // Create new account link
    return await db.account.create({
      data: {
        userId,
        provider,
        type: "oauth",
        providerAccountId,
        access_token: tokens.accessToken(),
        expires_at: tokens.accessTokenExpiresAt()
          ? Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000)
          : null,
        refresh_token: tryOr(tokens.refreshToken, null),
        token_type: "Bearer",
      },
    });
  } catch (error) {
    console.error("Error linking accounts:", error);
    throw error;
  }
}

export async function createSession(
  provider: ProviderKey,
  tokens: OAuth2Tokens,
  providerAccountId: string,
  userInfo: OAuthUser,
  userAgent?: string
) {
  try {
    // Find or create user
    const user = await findOrCreateUser(provider, userInfo, providerAccountId);
    if (!user) {
      throw new Error("Failed to find or create user");
    }

    // Link accounts (or update tokens)
    await linkAccounts(user.id, provider, tokens, providerAccountId);

    // Create session with 1 day expiry
    const session = await db.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent || "Unknown Device",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      },
      select: {
        id: true,
      },
    });

    if (!session) return null;
    return session.id;
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string) {
  await db.session.delete({
    where: {
      id: sessionId,
    },
  });
}

export async function getSession(sessionId: string) {
  const session = await db.session.findFirst({
    where: {
      id: sessionId,
    },
    include: {
      user: {
        include: {
          profile: true,
          account: true,
          adminForCourses: true,
          organization: true,
          enrolledUsers: true,
        },
      },
    },
  });

  if (session?.user) {
    await db.user.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });
  }

  if (!session || !session.user) return null;

  // Get the OAuth account if it exists
  const oauthAccount = session.user.account.find((a) => a.provider in providers);

  if (oauthAccount && oauthAccount.expires_at) {
    const provider = providers[oauthAccount.provider as ProviderKey];
    const expiresAt = new Date(oauthAccount.expires_at * 1000);

    if (expiresAt < new Date()) {
      if (!oauthAccount.refresh_token) {
        // If no refresh token, delete the session
        await deleteSession(sessionId);
        return null;
      }

      try {
        // Refresh the token
        const tokens = await provider.refreshAccessToken(oauthAccount.refresh_token);

        // Update the account with new tokens
        await db.account.update({
          where: { id: oauthAccount.id },
          data: {
            access_token: tokens.accessToken(),
            expires_at: tokens.accessTokenExpiresAt()
              ? Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000)
              : null,
            refresh_token: tryOr(tokens.refreshToken, null),
          },
        });
      } catch (error) {
        console.error("Failed to refresh token:", error);
        await deleteSession(sessionId);
        return null;
      }
    }
  }

  // Extend session expiry by 1 day
  const expiresAt = new Date(
    Math.min(
      session.expiresAt.getTime() + 1000 * 60 * 60 * 24, // extend by 1 day
      Date.now() + 1000 * 60 * 60 * 24 // max 1 day from now
    )
  );

  await db.session.update({
    where: { id: sessionId },
    data: { expiresAt },
  });

  return {
    ...session,
    expiresAt,
  };
}
