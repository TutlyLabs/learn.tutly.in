import { navigate } from "astro:transitions/client";
import { useEffect, useState } from "react";

export function useRouter() {
  const defaultPathname = globalThis.window
    ? globalThis.window.location.pathname
    : // @ts-ignore we're setting it from root layout
      globalThis.pathname;
  const [pathname, setPathname] = useState(defaultPathname);

  useEffect(() => {
    const handleRouteChange = (event: any) => {
      setPathname(event.location.pathname);
    };

    window.addEventListener("astro:page-load", handleRouteChange);

    return () => {
      window.removeEventListener("astro:page-load", handleRouteChange);
    };
  }, []);

  return {
    pathname,
    push: (path: string) => navigate(path),
  };
}
