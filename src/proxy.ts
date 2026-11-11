import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isDemoModeAllowed } from "@/lib/supabase/config";
import { publicUrl } from "@/lib/public-origin";

const PROTECTED_PREFIXES = ["/painel", "/onboarding", "/minha-conta", "/master"];

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = publicUrl(request, "/login");
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Checagem otimista de acesso (redirecionamentos). A autorização definitiva
 * acontece no servidor em `src/lib/auth/guards.ts` (páginas e Server Actions).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    // Modo de demonstração só em desenvolvimento. Em produção, sem Supabase
    // configurado, as áreas protegidas ficam BLOQUEADAS (falha segura).
    const { pathname } = request.nextUrl;
    if (
      !isDemoModeAllowed() &&
      PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      return NextResponse.redirect(publicUrl(request, "/"));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Atualiza a sessão nos cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Proteção de /painel/* e /onboarding/* (exigem usuário autenticado)
  if (pathname.startsWith("/painel") || pathname.startsWith("/onboarding")) {
    if (!user) {
      return redirectToLogin(request, pathname);
    }
  }

  // 2. Proteção de /minha-conta/* (exige usuário autenticado)
  if (pathname.startsWith("/minha-conta")) {
    if (!user) {
      return redirectToLogin(request, pathname);
    }
  }

  // 3. Proteção de /master/* (exige usuário autenticado com role === 'admin')
  if (pathname.startsWith("/master")) {
    if (!user) {
      return redirectToLogin(request, pathname);
    }

    // Consulta perfil para validar se role === 'admin'
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(publicUrl(request, "/"));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

