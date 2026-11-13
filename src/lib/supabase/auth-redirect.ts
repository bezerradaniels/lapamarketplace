import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AccountType } from "@/types/marketplace";
import { notifyAdminNewUserSignup } from "@/lib/resend";

/**
 * Sincroniza o perfil básico na tabela `public.profiles` (se não existir)
 * e resolve o redirecionamento inteligente pós-autenticação:
 * - Se já possui loja em `public.stores` -> `/painel`
 * - Se a intenção inicial / perfil era `merchant` (e não possui loja) -> `/onboarding`
 * - Se for `customer` -> `nextPath` (ex: `/` ou `/minha-conta`)
 */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  user: User,
  options?: {
    accountTypeIntent?: AccountType | string | null;
    nextPath?: string | null;
  }
): Promise<string> {
  // Se o fluxo for explicitamente redefinição de senha, respeita /nova-senha
  if (options?.nextPath && options.nextPath.startsWith("/nova-senha")) {
    return "/nova-senha";
  }

  // 1. Garante que o registro em `public.profiles` exista com o nome do usuário
  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Visitante Lapa";

  let profileRole: string | null = null;

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: user.id,
        full_name: metadataName,
      });

      // Se for primeiro acesso via OAuth (ex: Google), notifica o administrador via Resend
      if (user.app_metadata?.provider !== "email") {
        const provider = user.app_metadata?.provider || "google";
        const accountTypeIntent =
          options?.accountTypeIntent ||
          (user.user_metadata?.account_type as AccountType) ||
          "customer";

        await notifyAdminNewUserSignup({
          userId: user.id,
          fullName: metadataName,
          email: user.email || "Não informado",
          accountType: accountTypeIntent,
          method: provider === "google" ? "google_oauth" : "oauth",
        });
      }
    } else if (
      typeof (existingProfile as Record<string, unknown>).role === "string"
    ) {
      profileRole = (existingProfile as Record<string, string>).role;
    }
  } catch {
    // Caso a tabela profiles não tenha a coluna role ou RLS restrinja, segue normalmente
  }

  // 2. Verifica se o usuário já possui loja cadastrada em `public.stores`
  let hasStore = false;
  try {
    const { data: storeByOwner, error: ownerErr } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!ownerErr) {
      hasStore = Boolean(storeByOwner);
    } else {
      const { data: storeByUser } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      hasStore = Boolean(storeByUser);
    }
  } catch {
    hasStore = false;
  }

  if (hasStore) {
    return "/painel";
  }

  // 3. Se for lojista (por intenção ou role já definida), vai para o onboarding/criação de loja
  if (options?.accountTypeIntent === "merchant" || profileRole === "merchant") {
    return "/onboarding";
  }

  // 4. Se o usuário ainda não escolheu seu perfil (novo cadastro), direciona para o onboarding escolher
  if (!profileRole && !options?.accountTypeIntent) {
    return options?.nextPath
      ? `/onboarding?next=${encodeURIComponent(options.nextPath)}`
      : "/onboarding";
  }

  // 5. Cliente (`customer` com role já definida): redireciona para `nextPath` seguro ou `/minha-conta`
  if (
    options?.nextPath &&
    options.nextPath.startsWith("/") &&
    !options.nextPath.startsWith("//")
  ) {
    return options.nextPath;
  }

  return "/minha-conta";
}

