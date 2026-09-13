import { useEffect, useState } from "react";

import type { Week } from "../types/week";
import { getOrCreateCurrentWeek } from "../services/weekService";

export function useCurrentWeek() {
  const [week, setWeek] = useState<Week | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentWeek = await getOrCreateCurrentWeek();
      setWeek(currentWeek);
    } catch {
      setError("Something went wrong while loading the week. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { week, loading, error, refresh };
}
