import type { AstroCookies } from "astro";

import type { Cookies } from "../core/session";

export const adaptAstroCookiesToCookies = (astroCookies: AstroCookies): Cookies => {
  return {
    get: (key: string) => {
      const cookie = astroCookies.get(key);
      if (!cookie) return undefined;

      return {
        name: key,
        value: cookie.value,
      };
    },
    set: (
      key: string,
      value: string,
      options: {
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: "strict" | "lax";
        expires?: number;
      }
    ) => {
      astroCookies.set(key, value, {
        ...options,
        expires: options.expires ? new Date(options.expires) : undefined,
      });
    },
    delete: (key: string) => {
      astroCookies.delete(key);
    },
  };
};
