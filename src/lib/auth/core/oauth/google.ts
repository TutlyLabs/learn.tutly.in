import { z } from "zod";

import { env } from "@/lib/utils";

import { OAuthClient } from "./base";

export function createGoogleOAuthClient() {
  return new OAuthClient({
    provider: "google",
    clientId: env("GOOGLE_CLIENT_ID"),
    clientSecret: env("GOOGLE_CLIENT_SECRET"),
    scopes: ["openid", "email", "profile"],
    urls: {
      auth: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      user: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    userInfo: {
      schema: z.object({
        sub: z.string(),
        email: z.string().email(),
        email_verified: z.boolean(),
        name: z.string(),
        given_name: z.string(),
        family_name: z.string(),
        picture: z.string().url(),
        hd: z.string().optional(),
      }),
      parser: (user) => ({
        id: user.sub,
        name: user.name,
        email: user.email,
      }),
    },
  });
}
