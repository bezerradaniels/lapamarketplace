"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolvePostAuthRedirect } from "@/lib/supabase/auth-redirect";
import { notifyAdminNewUserSignup } from "@/lib/resend";
import { queueAnalyticsEvent } from "@/lib/analytics/server";
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth-config";
import type { AccountType } from "@/types/marketplace";

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
  redirectTo?: string;
}

async function getBaseSiteUrl(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const forwardedHost = headersList.get("x-forwarded-host");
  const proto = headersList.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${proto}://${forwardedHost}`;

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
  }
  if (lower.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }
  if (lower.includes("user already registered")) {
    return "Este e-mail já está cadastrado no Lapa Marketplace. Faça login ou recupere sua senha.";
  }
  if (lower.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.";
  }
  return message || "Ocorreu um erro inesperado na autenticação.";
}

/**
 * Login com E-mail e Senha
 */
export async function loginWithEmail(
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "").trim() || null;

  if (!email || !password) {
    return { error: "Por favor, preencha seu e-mail e sua senha." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: translateAuthError(error?.message || "Falha ao entrar."),
    };
  }

  const destination = await resolvePostAuthRedirect(supabase, data.user, {
    nextPath,
  });

  await queueAnalyticsEvent("login", { method: "email" });

  revalidatePath("/", "layout");
  redirect(destination);
}

/**
 * Cadastro Unificado (Cliente ou Lojista) com E-mail e Senha
 */
export async function signupWithEmail(
  formData: FormData
): Promise<AuthActionResult> {
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const rawAccountType = String(
    formData.get("account_type") || "customer"
  ).trim();
  const account_type: AccountType =
    rawAccountType === "merchant" ? "merchant" : "customer";

  if (!full_name) {
    return { error: "Informe seu nome completo." };
  }
  if (!email) {
    return { error: "Informe um e-mail válido." };
  }
  if (!password || password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    };
  }

  const siteUrl = await getBaseSiteUrl();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        account_type,
        role: account_type,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?account_type=${account_type}`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  await queueAnalyticsEvent("sign_up", {
    method: "email",
    account_type,
  });

  // Notificar administrador sobre o novo cadastro via Resend
  await notifyAdminNewUserSignup({
    userId: data.user?.id,
    fullName: full_name,
    email,
    accountType: account_type,
    method: "email_password",
  });

  // Se o Supabase já criou a sessão imediatamente (confirmação de e-mail desativada)
  if (data.user && data.session) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          full_name,
        },
        { onConflict: "id" }
      );
    } catch {
      // Ignora erro caso trigger já tenha criado o profile
    }

    const destination = await resolvePostAuthRedirect(supabase, data.user, {
      accountTypeIntent: account_type,
    });

    revalidatePath("/", "layout");
    redirect(destination);
  }

  return {
    success: true,
    requiresEmailConfirmation: true,
    message:
      "Conta criada! Enviamos um link de confirmação para o seu e-mail para ativar seu acesso.",
  };
}

/**
 * Reenviar o e-mail de confirmação para o usuário logado que ainda não
 * confirmou o endereço (acesso liberado antes da confirmação).
 */
export async function resendConfirmationEmail(): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "Não foi possível reenviar o e-mail agora." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Entre na sua conta para reenviar a confirmação." };
  }

  if (user.email_confirmed_at) {
    return { success: true, message: "Seu e-mail já está confirmado." };
  }

  const siteUrl = await getBaseSiteUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/minha-conta`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return {
    success: true,
    message: `Enviamos um novo link para ${user.email}. Confira também o spam.`,
  };
}

/**
 * Login / Cadastro com Google OAuth (1 clique) via Server Action
 */
export async function loginWithGoogle(
  formData: FormData
): Promise<AuthActionResult> {
  if (!GOOGLE_AUTH_ENABLED) {
    return {
      error: "Entrar com o Google está indisponível no momento. Use seu e-mail e senha.",
    };
  }

  const rawAccountType = String(
    formData.get("account_type") || "customer"
  ).trim();
  const accountType: AccountType =
    rawAccountType === "merchant" ? "merchant" : "customer";
  const nextPath = String(formData.get("next") || "").trim();

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    };
  }

  const siteUrl = await getBaseSiteUrl();
  const supabase = await createClient();

  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("account_type", accountType);
  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return {
      error: translateAuthError(
        error?.message || "Não foi possível iniciar o login com o Google."
      ),
    };
  }

  redirect(data.url);
}

/**
 * Solicitar link de redefinição de senha por e-mail
 */
export async function requestPasswordReset(
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { error: "Digite o e-mail da sua conta para recuperar a senha." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    };
  }

  const siteUrl = await getBaseSiteUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/nova-senha`,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return {
    success: true,
    message:
      "Enviamos um link de recuperação para o seu e-mail! Verifique sua caixa de entrada e o spam.",
  };
}

/**
 * Definir nova senha para o usuário autenticado pelo link de recuperação
 */
export async function updatePassword(
  formData: FormData
): Promise<AuthActionResult> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!password || password.length < 6) {
    return { error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: "As senhas digitadas não coincidem." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Sua senha foi atualizada com sucesso!",
    redirectTo: "/minha-conta",
  };
}

/**
 * Encerrar sessão do usuário (Sign Out)
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await queueAnalyticsEvent("logout");
  revalidatePath("/", "layout");
  redirect("/login");
}

