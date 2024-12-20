import type { APIRoute } from "astro";

import { signInWithCredentials } from "@/lib/auth/credentials";
import { setSessionCookie } from "@/lib/auth/session";

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const { sessionId, user } = await signInWithCredentials(email, password, userAgent);

    setSessionCookie({ cookies } as any, sessionId, new Date(Date.now() + 1000 * 60 * 60 * 24));

    return new Response(
      JSON.stringify({
        success: true,
        user,
        redirectTo: "/dashboard",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
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
