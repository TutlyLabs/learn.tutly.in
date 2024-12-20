import type { User } from "@prisma/client";
import type { OAuth2Tokens } from "arctic";

import db from "../db";
import * as credentials from "./credentials";
// import * as github from "./github";
import * as google from "./google";

export type OAuthUser = {
  name: string;
  email: string;
  avatar_url: string;
  providerAccountId?: string;
};

interface Provider {
  createAuthorizationURL(url?: URL): {
    state: string;
    codeVerifier: string;
    redirectUrl: URL;
  };
  validateAuthorizationCode(code: string, codeVerifier: string, url?: URL): Promise<OAuth2Tokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens>;
  revokeAccessToken(token: string): Promise<void>;
  fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser | null>;
  getLastCodeVerifier?(): string | undefined;
}

export const AUTH_SESSION_COOKIE = "session";
export const AUTH_STATE_COOKIE = "oauth_state";

export type AuthState = {
  state: string;
  codeVerifier: string;
  from?: string;
  provider: ProviderKey;
  timestamp: number;
};

export const providers = {
  credentials: credentials as Provider,
  // github: github as Provider,
  google: google as Provider,
};

export type ProviderKey = keyof typeof providers;

export async function findOrCreateUser(
  provider: ProviderKey,
  userInfo: OAuthUser,
  providerAccountId: string
): Promise<User | null> {
  try {
    const existingAccount = await db.account.findFirst({
      where: {
        provider,
        providerAccountId,
      },
      include: {
        user: true,
      },
    });

    if (existingAccount) {
      const user = existingAccount.user;
      return user as User;
    }

    const username =
      userInfo.email?.split("@")[0]?.toLowerCase() ||
      `user_${Math.random().toString(36).slice(2, 7)}`;

    const user = await db.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.avatar_url,
        username,
        account: {
          create: {
            provider,
            providerAccountId,
            type: "oauth",
          },
        },
      },
    });

    return user as User;
  } catch (error) {
    console.error("Error finding/creating user:", error);
    return null;
  }
}

export function tryOr<T, E>(fn: () => T, fallback: E): T | E {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export async function linkAccounts(
  userId: string,
  provider: ProviderKey,
  tokens: OAuth2Tokens,
  providerAccountId: string
) {
  try {
    const existingAccount = await db.account.findFirst({
      where: {
        provider,
        providerAccountId,
      },
    });

    if (existingAccount) {
      if (existingAccount.userId === userId) {
        return await db.account.update({
          where: { id: existingAccount.id },
          data: {
            access_token: tokens.accessToken(),
            expires_at: tokens.accessTokenExpiresAt()
              ? Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000)
              : null,
            refresh_token: tryOr(() => tokens.refreshToken(), null),
            token_type: tokens.tokenType(),
          },
        });
      } else {
        throw new Error("Provider account already linked to different user");
      }
    }

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
        refresh_token: tryOr(() => tokens.refreshToken(), null),
        token_type: tokens.tokenType(),
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
    const user = await findOrCreateUser(provider, userInfo, providerAccountId);
    if (!user) {
      throw new Error("Failed to find or create user");
    }

    await linkAccounts(user.id, provider, tokens, providerAccountId);

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

    return session.id;
  } catch (error) {
    console.error("[Auth] Error creating session:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    await db.session.delete({
      where: {
        id: sessionId,
      },
    });
  } catch (error) {
    console.error("Error deleting session:", error);
  }
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
