"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 20000;

export default function AdminAutoRefresh() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastRefresh(new Date());

    function refresh() {
      router.refresh();
      setLastRefresh(new Date());
    }

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);

    // Also catch up immediately when the admin comes back to this tab,
    // rather than waiting for the next tick.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return (
    <button
      onClick={() => {
        router.refresh();
        setLastRefresh(new Date());
      }}
      className="text-[11px] text-muted flex items-center gap-1.5"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
      {lastRefresh
        ? `Actualisé à ${lastRefresh.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
        : "Actualisation…"}
    </button>
  );
}
