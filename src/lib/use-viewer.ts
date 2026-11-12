"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Quem está navegando (lado do cliente), para o header e a barra inferior:
 * primeiro nome / avatar e, se for lojista, a própria loja.
 * Uma só consulta por carregamento de página (promessa compartilhada entre componentes).
 */
export interface Viewer {
  firstName: string;
  initials: string;
  avatarUrl: string | null;
  store: {
    slug: string;
    name: string;
    avatarUrl: string | null;
    isPremium: boolean;
  } | null;
}

let viewerPromise: Promise<Viewer | null> | null = null;

async function loadViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [{ data: profile }, { data: store }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle(),
    ]);

    const fullName =
      (profile?.full_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Visitante";
    const parts = fullName.trim().split(/\s+/);
    const initials = (
      parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : fullName.slice(0, 2)
    ).toUpperCase();

    return {
      firstName: parts[0],
      initials,
      avatarUrl: (profile?.avatar_url as string | null) ?? null,
      store: store
        ? {
            slug: String(store.slug),
            name: String(store.name ?? ""),
            avatarUrl:
              (store.avatar_url as string | null) ??
              (store.logo_url as string | null) ??
              null,
            isPremium: store.plan_tier === "premium",
          }
        : null,
    };
  } catch {
    return null;
  }
}

export function useViewer(): Viewer | null {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  useEffect(() => {
    let alive = true;
    viewerPromise ??= loadViewer();
    viewerPromise.then((v) => alive && setViewer(v));
    return () => {
      alive = false;
    };
  }, []);
  return viewer;
}
