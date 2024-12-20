import { Google, OAuth2Tokens, generateCodeVerifier, generateState } from "arctic";

import type { OAuthUser } from ".";
import { envOrThrow } from "../utils";

const googleClientId = envOrThrow("GOOGLE_CLIENT_ID");
const googleClientSecret = envOrThrow("GOOGLE_CLIENT_SECRET");

let lastState: { state: string; codeVerifier: string } | null = null;

function google(url?: URL) {
  url ??= new URL("http://localhost:4321");
  const callbackUrl = new URL("/api/auth/callback/google", url);

  if (import.meta.env.PROD) {
    callbackUrl.protocol = "https:";
  }

  return new Google(googleClientId, googleClientSecret, callbackUrl.toString());
}

export function createAuthorizationURL(url?: URL) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["email", "profile", "openid"];

  const g = google(url);
  const redirectUrl = g.createAuthorizationURL(state, codeVerifier, scopes);

  lastState = { state, codeVerifier };

  return {
    state,
    codeVerifier,
    redirectUrl,
  };
}

export function getLastCodeVerifier() {
  return lastState?.codeVerifier;
}

export function validateAuthorizationCode(code: string, codeVerifier: string, url?: URL) {
  const g = google(url);
  return g.validateAuthorizationCode(code, codeVerifier);
}

export function refreshAccessToken(refreshToken: string) {
  const g = google();
  return g.refreshAccessToken(refreshToken);
}

export function revokeAccessToken(accessToken: string) {
  const g = google();
  return g.revokeToken(accessToken);
}

type GoogleUser = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture: string;
};

export async function fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
    },
  })
    .then((res) => res.json() as Promise<GoogleUser>)
    .catch((err) => {
      console.error("Error fetching Google user:", err);
      return null;
    });

  if (!res) return null;

  return {
    name: res.name,
    email: res.email,
    avatar_url: res.picture,
    providerAccountId: res.id,
  };
}
