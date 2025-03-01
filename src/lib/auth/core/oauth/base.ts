import crypto from "crypto";
import { z } from "zod";

import { env } from "@/lib/utils";

import { Cookies } from "../session";
import { createGithubOAuthClient } from "./github";
import { createGoogleOAuthClient } from "./google";

export type OAuthProvider = "google" | "github";
const STATE_COOKIE_KEY = "oAuthState";
const CODE_VERIFIER_COOKIE_KEY = "oAuthCodeVerifier";
const COOKIE_EXPIRATION_SECONDS = 60 * 10; // 10 min

export class OAuthClient<T> {
  private readonly provider: OAuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
    user: string;
  };
  private readonly userInfo: {
    schema: z.ZodSchema<T>;
    parser: (data: T) => { id: string; email: string; name: string };
  };
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: {
    provider: OAuthProvider;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    urls: {
      auth: string;
      token: string;
      user: string;
    };
    userInfo: {
      schema: z.ZodSchema<T>;
      parser: (data: T) => { id: string; email: string; name: string };
    };
  }) {
    console.log("[OAuth] Initializing OAuth client for provider:", provider);
    console.log("[OAuth] Client ID present:", !!clientId);
    console.log("[OAuth] Client Secret present:", !!clientSecret);

    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  private get redirectUrl() {
    try {
      const baseUrl = env("OAUTH_REDIRECT_URL_BASE");
      console.log("[OAuth] Base redirect URL:", baseUrl);
      const url = new URL(this.provider, baseUrl);
      console.log("[OAuth] Full redirect URL:", url.toString());
      return url;
    } catch (error) {
      console.error("[OAuth] Error constructing redirect URL:", error);
      throw error;
    }
  }

  createAuthUrl(cookies: Pick<Cookies, "set">) {
    console.log("[OAuth] Creating auth URL for provider:", this.provider);
    try {
      const state = createState(cookies);
      const codeVerifier = createCodeVerifier(cookies);
      const url = new URL(this.urls.auth);
      url.searchParams.set("client_id", this.clientId);
      url.searchParams.set("redirect_uri", this.redirectUrl.toString());
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", this.scopes.join(" "));
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("code_challenge", crypto.hash("sha256", codeVerifier, "base64url"));

      console.log("[OAuth] Generated auth URL:", url.toString());
      console.log("[OAuth] State cookie set:", state);
      console.log("[OAuth] Code verifier cookie set:", !!codeVerifier);

      return url.toString();
    } catch (error) {
      console.error("[OAuth] Error creating auth URL:", error);
      throw error;
    }
  }

  async fetchUser(code: string, state: string, cookies: Pick<Cookies, "get">) {
    console.log("[OAuth] Fetching user with code:", code);
    console.log("[OAuth] Validating state:", state);

    try {
      const isValidState = await validateState(state, cookies);
      console.log("[OAuth] State validation result:", isValidState);

      if (!isValidState) throw new InvalidStateError();

      const { accessToken, tokenType } = await this.fetchToken(code, getCodeVerifier(cookies));
      console.log("[OAuth] Successfully obtained access token");

      const user = await fetch(this.urls.user, {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((rawData) => {
          console.log("[OAuth] Raw user data received:", JSON.stringify(rawData));
          const { data, success, error } = this.userInfo.schema.safeParse(rawData);
          if (!success) {
            console.error("[OAuth] User data validation failed:", error);
            throw new InvalidUserError(error);
          }
          return data;
        });

      const parsedUser = this.userInfo.parser(user);
      console.log("[OAuth] Successfully parsed user data");
      return parsedUser;
    } catch (error) {
      console.error("[OAuth] Error in fetchUser:", error);
      throw error;
    }
  }

  private fetchToken(code: string, codeVerifier: string) {
    console.log("[OAuth] Fetching token with code verifier present:", !!codeVerifier);

    return fetch(this.urls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl.toString(),
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: codeVerifier,
      }),
    })
      .then((res) => res.json())
      .then((rawData) => {
        console.log("[OAuth] Raw token response:", JSON.stringify(rawData));
        const { data, success, error } = this.tokenSchema.safeParse(rawData);
        if (!success) {
          console.error("[OAuth] Token validation failed:", error);
          throw new InvalidTokenError(error);
        }
        return {
          accessToken: data.access_token,
          tokenType: data.token_type,
        };
      });
  }
}

export function getOAuthClient(provider: OAuthProvider) {
  console.log("[OAuth] Getting OAuth client for provider:", provider);
  try {
    switch (provider) {
      case "google":
        return createGoogleOAuthClient();
      case "github":
        return createGithubOAuthClient();
      default:
        throw new Error(`Invalid provider: ${provider satisfies never}`);
    }
  } catch (error) {
    console.error("[OAuth] Error creating OAuth client:", error);
    throw error;
  }
}

class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid Token");
    this.cause = zodError;
  }
}

class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid User");
    this.cause = zodError;
  }
}

class InvalidStateError extends Error {
  constructor() {
    super("Invalid State");
  }
}

class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid Code Verifier");
  }
}

function createState(cookies: Pick<Cookies, "set">) {
  const state = crypto.randomBytes(64).toString("hex").normalize();
  cookies.set(STATE_COOKIE_KEY, state, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_EXPIRATION_SECONDS
  });
  return state;
}

function createCodeVerifier(cookies: Pick<Cookies, "set">) {
  const codeVerifier = crypto.randomBytes(64).toString("hex").normalize();
  cookies.set(CODE_VERIFIER_COOKIE_KEY, codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_EXPIRATION_SECONDS
  });
  return codeVerifier;
}

function validateState(state: string, cookies: Pick<Cookies, "get">) {
  const cookieState = cookies.get(STATE_COOKIE_KEY)?.value;
  return cookieState === state;
}

function getCodeVerifier(cookies: Pick<Cookies, "get">) {
  const codeVerifier = cookies.get(CODE_VERIFIER_COOKIE_KEY)?.value;
  if (codeVerifier == null) throw new InvalidCodeVerifierError();
  return codeVerifier;
}
