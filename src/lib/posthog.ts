import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export default function PostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog("phc_fkSt1fQ3v4zrEcSB1TWZMHGA5B0Q0hAB70JlZcINrMU", {
      host: "https://us.i.posthog.com",
    });
  }
  return posthogClient;
}

export const posthog = PostHogClient();
