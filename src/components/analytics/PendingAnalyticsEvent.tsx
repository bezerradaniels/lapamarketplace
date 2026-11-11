"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  PENDING_EVENT_COOKIE,
  trackEvent,
  type AnalyticsEventName,
} from "@/lib/analytics";

/**
 * Dispara eventos agendados pelo servidor (cookie `lapa_pending_event`)
 * depois de redirects de login/cadastro, e apaga o cookie em seguida.
 */
export function PendingAnalyticsEvent() {
  const pathname = usePathname();

  useEffect(() => {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${PENDING_EVENT_COOKIE}=`))
      ?.slice(PENDING_EVENT_COOKIE.length + 1);
    if (!raw) return;

    document.cookie = `${PENDING_EVENT_COOKIE}=; path=/; max-age=0; samesite=lax`;

    try {
      const { name, params } = JSON.parse(decodeURIComponent(raw)) as {
        name: AnalyticsEventName;
        params?: Record<string, string>;
      };
      if (name) trackEvent(name, params);
    } catch {
      // cookie inválido: ignora
    }
  }, [pathname]);

  return null;
}
