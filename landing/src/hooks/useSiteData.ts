import { useEffect, useState } from "react";
import type { SiteData } from "../types";

export function useSiteData() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return { data, error, loading: !data && !error };
}
