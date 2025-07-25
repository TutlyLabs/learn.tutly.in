import type { APIRoute } from "astro";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import db from "@/lib/db";

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/sign-in",
      },
    });
  }

  await db.session.delete({
    where: {
      id: sessionId,
    },
  });

  cookies.delete(AUTH_COOKIE_NAME, {
    path: "/",
  });

  return new Response(
    `
    <script>
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      window.location.href = '/sign-in';
    </script>
  `,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
};
