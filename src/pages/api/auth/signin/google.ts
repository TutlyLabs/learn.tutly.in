import { createId, init } from "@paralleldrive/cuid2";
import type { APIContext } from "astro";
import { createHash } from "node:crypto";
import queryString from "query-string";

import { getSiteUrl } from "@/lib/utils/get-site-url";

// import { env } from "@/lib/utils";

export async function GET({ cookies }: APIContext) {
  cookies.delete("google_oauth_state", {
    path: "/",
  });
  cookies.delete("google_code_challenge", {
    path: "/",
  });

  const googleOauthState = createId();
  cookies.set("google_oauth_state", googleOauthState, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 60 * 10, // 10 minutes
  });

  const generateId = init({ length: 40 });
  const googleCodeChallenge = generateId();
  const codeChallenge = createHash("sha256").update(googleCodeChallenge).digest("base64url");

  cookies.set("google_code_challenge", googleCodeChallenge, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 60 * 10, // 10 minutes
  });

  const authorizationUrl = queryString.stringifyUrl({
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    query: {
      scope: "openid email profile",
      response_type: "code",
      // TODO: Remove this
      client_id: "460571681510-m89qo4361lus81uroooa2r5rg11u4nni.apps.googleusercontent.com",
      redirect_uri: `${getSiteUrl()}/api/auth/callback/google`,
      state: googleOauthState,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    },
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
    },
  });
}
