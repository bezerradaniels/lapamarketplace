import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isDemoModeAllowed } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = ["/painel", "/onboarding", "/minha-conta", "/master"];

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
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
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
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Proteção de /minha-conta/* (exige usuário autenticado)
  if (pathname.startsWith("/minha-conta")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Proteção de /master/* (exige usuário autenticado com role === 'admin')
  if (pathname.startsWith("/master")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Consulta perfil para validar se role === 'admin'
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

