import { AstroCookies } from "astro";

import db from "@/lib/db";

import { getUserFromSession } from "../core/session";
import { adaptAstroCookiesToCookies } from "./cookies";

type FullUser = Exclude<Awaited<ReturnType<typeof getUserFromDb>>, undefined | null>;

type User = Exclude<Awaited<ReturnType<typeof getUserFromSession>>, undefined | null>;

function _getCurrentUser(
  options: {
    withFullUser: true;
    redirectIfNotFound: true;
  },
  cookies: AstroCookies
): Promise<FullUser>;
function _getCurrentUser(
  options: {
    withFullUser: true;
    redirectIfNotFound?: false;
  },
  cookies: AstroCookies
): Promise<FullUser | null>;
function _getCurrentUser(
  options: {
    withFullUser?: false;
    redirectIfNotFound: true;
  },
  cookies: AstroCookies
): Promise<User>;
function _getCurrentUser(
  options: {
    withFullUser?: false;
    redirectIfNotFound?: false;
  },
  cookies: AstroCookies
): Promise<User | null>;
async function _getCurrentUser(
  { withFullUser = false, redirectIfNotFound = false } = {},
  cookies: AstroCookies
) {
  const user = await getUserFromSession(adaptAstroCookiesToCookies(cookies));

  if (user == null) {
    if (redirectIfNotFound) {
      throw new Error("Unauthorized");
    }
    return null;
  }

  if (withFullUser) {
    const fullUser = await getUserFromDb(user.id);
    if (fullUser == null) throw new Error("User not found in database");
    return fullUser;
  }

  return user;
}

export const getCurrentUser = _getCurrentUser;

const getUserFromDb = async (id: string) => {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });
};
