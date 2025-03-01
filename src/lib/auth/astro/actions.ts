"use server";

import { defineAction } from "astro:actions";
import bcrypt from "bcrypt";
import { z } from "zod";

import db from "@/lib/db";

import { getOAuthClient } from "../core/oauth/base";
import type { OAuthProvider } from "../core/oauth/base";
import { createUserSession, removeUserFromSession } from "../core/session";
import { adaptAstroCookiesToCookies } from "./cookies";
import { signInSchema, signUpSchema } from "./schemas";

export const signIn = defineAction({
  input: signInSchema,
  async handler({ email, password }, { cookies }) {
    try {
      const user = await db.user.findFirst({
        where: { email },
        select: {
          id: true,
          password: true,
          role: true,
        },
      });

      if (!user?.password) {
        return {
          error: "No password set for this account, please reset your password",
        };
      }

      const isCorrectPassword = await bcrypt.compare(password, user.password);

      if (!isCorrectPassword) {
        return {
          error: "Invalid credentials",
        };
      }

      await createUserSession(user, adaptAstroCookiesToCookies(cookies));

      return {
        success: true,
        redirect: "/",
      };
    } catch (error) {
      return {
        error: "An error occurred during sign in",
      };
    }
  },
});

export const signUp = defineAction({
  input: signUpSchema,
  async handler({ name, email, password }, { cookies }) {
    try {
      const existingUser = await db.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return {
          error: "Account already exists",
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const username = email.split("@")[0]!;

      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          username,
          role: "STUDENT",
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        return {
          error: "Failed to create account",
        };
      }

      await createUserSession(user, adaptAstroCookiesToCookies(cookies));

      return {
        success: true,
        redirect: "/",
      };
    } catch (error) {
      return {
        error: "Failed to create account",
      };
    }
  },
});

export const logOut = defineAction({
  async handler(_, { cookies }) {
    await removeUserFromSession(adaptAstroCookiesToCookies(cookies));
    return {
      success: true,
      redirect: "/",
    };
  },
});

export const oAuthSignIn = defineAction({
  input: z.object({
    provider: z.custom<OAuthProvider>(),
  }),
  async handler({ provider }, { cookies }) {
    console.log("[OAuth Action] Starting OAuth sign-in for provider:", provider);
    try {
      const oAuthClient = getOAuthClient(provider);
      console.log("[OAuth Action] Successfully created OAuth client");

      const adaptedCookies = adaptAstroCookiesToCookies(cookies);
      console.log("[OAuth Action] Adapted cookies for OAuth flow");

      const authUrl = oAuthClient.createAuthUrl(adaptedCookies);
      console.log("[OAuth Action] Generated auth URL:", authUrl);

      return {
        success: true,
        redirect: authUrl,
      };
    } catch (error) {
      console.error("[OAuth Action] Error in OAuth sign-in:", error);
      throw error;
    }
  },
});


