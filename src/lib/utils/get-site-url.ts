import { env } from "@/lib/utils";

const getSiteUrl = () => {
  return env("FRONTEND_URL") || "https://learn.tutly.in";
};

export { getSiteUrl };
