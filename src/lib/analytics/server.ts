import { cookies } from "next/headers";
import { PENDING_EVENT_COOKIE, type AnalyticsEventName } from "./index";

/**
 * Agenda um evento de analytics para ser disparado no navegador na próxima
 * página. Usado quando a ação termina com `redirect()` no servidor (login,
 * cadastro, retorno do Google), onde o código do cliente não chega a rodar.
 * O cookie é lido e apagado por `PendingAnalyticsEvent`.
 */
export async function queueAnalyticsEvent(
  name: AnalyticsEventName,
  params: Record<string, string> = {}
): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_EVENT_COOKIE, JSON.stringify({ name, params }), {
      path: "/",
      maxAge: 120,
      sameSite: "lax",
      httpOnly: false,
    });
  } catch {
    // Fora de Server Action / Route Handler o cookie não pode ser gravado
  }
}

/** Valor do cookie para uso direto em `NextResponse.cookies.set`. */
export function pendingEventCookie(
  name: AnalyticsEventName,
  params: Record<string, string> = {}
) {
  return {
    name: PENDING_EVENT_COOKIE,
    value: JSON.stringify({ name, params }),
    path: "/",
    maxAge: 120,
    sameSite: "lax" as const,
    httpOnly: false,
  };
}
