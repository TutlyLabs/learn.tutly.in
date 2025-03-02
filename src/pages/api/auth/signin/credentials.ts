import type { APIRoute } from "astro";

import { signInWithCredentials } from "@/lib/auth/credentials";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return new Response(null, {
        status: 302,
        headers: {
          Location:
            "/sign-in?error=" + encodeURIComponent("Email/username and password are required"),
        },
      });
    }

    const userAgent = request.headers.get("user-agent");
    const { sessionId, isPasswordSet } = await signInWithCredentials(email, password, userAgent);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day
    const isProduction = import.meta.env.PROD;

    const cookieOptions = [
      `app_auth_token=${sessionId}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Expires=${expiresAt.toUTCString()}`,
      isProduction ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return new Response(null, {
      status: 302,
      headers: {
        Location: isPasswordSet ? "/dashboard" : "/change-password",
        "Set-Cookie": cookieOptions,
      },
    });
  } catch (error: any) {
    console.error("[Credentials API] Sign in error:", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/sign-in?error=" + encodeURIComponent(error.message || "Authentication failed"),
      },
    });
  }
};
