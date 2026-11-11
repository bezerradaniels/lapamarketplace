import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolvePostAuthRedirect } from "@/lib/supabase/auth-redirect";
import { getPublicOrigin } from "@/lib/public-origin";
import { pendingEventCookie } from "@/lib/analytics/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const accountType =
    searchParams.get("account_type") || searchParams.get("intent");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Login indisponível no momento. Tente novamente mais tarde."
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const destination = await resolvePostAuthRedirect(supabase, data.user, {
        accountTypeIntent: accountType,
        nextPath: next,
      });

      const response = NextResponse.redirect(`${origin}${destination}`);

      // Analytics: no Google (OAuth), conta criada há menos de 5 min = cadastro.
      // Cadastro por e-mail já foi contado em `signupWithEmail`; aqui é login.
      const provider = String(data.user.app_metadata?.provider || "email");
      const createdAt = Date.parse(data.user.created_at || "");
      const isNewUser =
        provider !== "email" &&
        Number.isFinite(createdAt) &&
        Date.now() - createdAt < 5 * 60 * 1000;
      response.cookies.set(
        isNewUser
          ? pendingEventCookie("sign_up", {
              method: provider,
              account_type: accountType === "merchant" ? "merchant" : "customer",
            })
          : pendingEventCookie("login", { method: provider })
      );

      return response;
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Não foi possível concluir a autenticação com o Google. Tente novamente."
    )}`
  );
}
