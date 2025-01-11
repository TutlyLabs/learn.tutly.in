import { useCallback, useEffect, useState } from "react";

import { useRouter } from "~/hooks/use-router";

export function useSearchParams() {
  const router = useRouter();
  const [searchParams, setInternalSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInternalSearchParams(params);
  }, [router.pathname]);

  const setSearchParams = useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      const newParams = updater(new URLSearchParams(searchParams.toString()));
      const newSearch = newParams.toString();
      const newPath = router.pathname + (newSearch ? `?${newSearch}` : "");

      router.push(newPath);
    },
    [router, searchParams]
  );

  return [searchParams, setSearchParams] as const;
}
