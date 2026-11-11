import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isDemoModeAllowed, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Guardas de autorização executadas no servidor.
 *
 * O proxy (`src/proxy.ts`) faz apenas uma checagem otimista de redirecionamento.
 * A autorização real precisa acontecer perto dos dados: em layouts/páginas
 * protegidas e no início de cada Server Action que altera dados, porque
 * Server Actions podem ser chamadas diretamente via POST, sem passar pela página.
 *
 * Regra de falha segura: se o Supabase não estiver configurado em produção,
 * o acesso é NEGADO (o "modo demonstração" só existe em desenvolvimento).
 */

type AuthContext = {
  supabase: SupabaseClient;
  user: User;
  role: string | null;
};

type GuardResult =
  | ({ ok: true; demo: false } & AuthContext)
  | { ok: true; demo: true }
  | { ok: false; reason: "unconfigured" | "unauthenticated" | "forbidden" };

async function resolveAuth(requireAdmin: boolean): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    return isDemoModeAllowed()
      ? { ok: true, demo: true }
      : { ok: false, reason: "unconfigured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  let role: string | null = null;
  if (requireAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = (profile?.role as string | undefined) ?? null;

    if (role !== "admin") {
      return { ok: false, reason: "forbidden" };
    }
  }

  return { ok: true, demo: false, supabase, user, role };
}

function loginRedirect(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

/** Para Server Components (layouts/páginas): exige usuário autenticado. */
export async function requireUserPage(nextPath: string) {
  const result = await resolveAuth(false);
  if (!result.ok) {
    if (result.reason === "unconfigured") redirect("/");
    loginRedirect(nextPath);
  }
  return result;
}

/** Para Server Components (layouts/páginas): exige usuário com role 'admin'. */
export async function requireAdminPage(nextPath: string) {
  const result = await resolveAuth(true);
  if (!result.ok) {
    if (result.reason === "unauthenticated") loginRedirect(nextPath);
    redirect("/");
  }
  return result;
}

const ACTION_ERRORS = {
  unconfigured: "Serviço indisponível no momento.",
  unauthenticated: "Sua sessão expirou. Faça login novamente.",
  forbidden: "Você não tem permissão para esta ação.",
} as const;

/** Para Server Actions: exige usuário autenticado. */
export async function authorizeUserAction() {
  const result = await resolveAuth(false);
  if (!result.ok) return { error: ACTION_ERRORS[result.reason] } as const;
  return result;
}

/** Para Server Actions: exige usuário com role 'admin'. */
export async function authorizeAdminAction() {
  const result = await resolveAuth(true);
  if (!result.ok) return { error: ACTION_ERRORS[result.reason] } as const;
  return result;
}
