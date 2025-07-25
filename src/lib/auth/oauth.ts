import { GitHub, Google } from "arctic";

import { env } from "@/lib/utils";

export const google = new Google(
  env("GOOGLE_CLIENT_ID"),
  env("GOOGLE_CLIENT_SECRET"),
  `${env("FRONTEND_URL")}/api/auth/signin/google/callback`
);

export const github = new GitHub(
  env("GITHUB_CLIENT_ID"),
  env("GITHUB_CLIENT_SECRET"),
  `${env("FRONTEND_URL")}/api/auth/signin/github/callback`
);
