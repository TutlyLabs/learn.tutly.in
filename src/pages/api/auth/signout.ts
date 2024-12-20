import { deleteSession } from "@lib/auth";
import { deleteSessionCookie } from "@lib/auth/session";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get("session")?.value;
  if (!token) return redirect("/sign-in");

  await deleteSession(token);

  deleteSessionCookie({ cookies } as any);

  return redirect("/sign-in");
};
