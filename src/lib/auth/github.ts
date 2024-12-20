// @ts-nocheck
import { GitHub, OAuth2Tokens, generateCodeVerifier, generateState } from "arctic";

import type { OAuthUser } from ".";
import { envOrThrow } from "../utils";

const githubClientId = envOrThrow("GITHUB_CLIENT_ID");
const githubClientSecret = envOrThrow("GITHUB_CLIENT_SECRET");

let lastState: { state: string; codeVerifier: string } | null = null;

function github(url?: URL) {
  url ??= new URL("http://localhost:4321");
  const callbackUrl = new URL("/api/auth/callback/github", url);

  if (import.meta.env.PROD) {
    callbackUrl.protocol = "https:";
  }

  return new GitHub(githubClientId, githubClientSecret, callbackUrl.toString());
}

export function createAuthorizationURL(url?: URL) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["user:email", "read:user"];

  const g = github(url);
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
  const g = github(url);
  return g.validateAuthorizationCode(code, codeVerifier);
}

export function refreshAccessToken(refreshToken: string) {
  const g = github();
  return g.refreshAccessToken(refreshToken);
}

export function revokeAccessToken(accessToken: string) {
  const g = github();
  return g.revokeToken(accessToken);
}

type GithubUser = {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
};

export async function fetchUser(tokens: OAuth2Tokens): Promise<OAuthUser | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
    },
  })
    .then((res) => res.json() as Promise<GithubUser>)
    .catch((err) => {
      console.error("Error fetching Github user:", err);
      return null;
    });

  if (!res) return null;

  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
    },
  })
    .then(
      (res) => res.json() as Promise<Array<{ email: string; primary: boolean; verified: boolean }>>
    )
    .catch(() => []);

  const primaryEmail = emailRes.find((e) => e.primary)?.email || res.email;

  return {
    name: res.name || res.login,
    email: primaryEmail,
    avatar_url: res.avatar_url,
    providerAccountId: res.id.toString(),
  };
}
