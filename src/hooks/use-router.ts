import { navigate } from "astro:transitions/client";
import { useEffect, useState } from "react";

export function useRouter() {
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const handleRouteChange = (event: any) => {
      setPathname(event?.location?.pathname || window.location.pathname);
    };

    window.addEventListener("astro:page-load", handleRouteChange);

    return () => {
      window.removeEventListener("astro:page-load", handleRouteChange);
    };
  }, []);

  const push = async (path: string) => {
    try {
      await navigate(path);
    } catch (err) {
      window.location.href = path;
    }
  };

  return {
    pathname,
    push,
  };
}
