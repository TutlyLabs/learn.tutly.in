import type { APIRoute } from "astro";

import { signInWithCredentials } from "@/lib/auth/credentials";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email/username and password are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        message: isPasswordSet ? "Logged In Successfully" : "Please set a new password",
        redirectTo: isPasswordSet ? "/dashboard" : "/change-password",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieOptions,
        },
      }
    );
  } catch (error: any) {
    console.error("[Credentials API] Sign in error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Authentication failed",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
