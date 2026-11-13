import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { FALLBACK_GLOBAL_CATEGORIES } from "@/lib/panel-data";
import type { NeighborhoodItem } from "@/types/marketplace";

const FALLBACK_LAPA_NEIGHBORHOODS: NeighborhoodItem[] = [
  { id: "centro", name: "Centro", slug: "centro" },
  { id: "sao-joao", name: "São João", slug: "sao-joao" },
  { id: "parque-verde", name: "Parque Verde", slug: "parque-verde" },
  { id: "sao-gotardo", name: "São Gotardo", slug: "sao-gotardo" },
  { id: "beira-rio", name: "Beira Rio", slug: "beira-rio" },
  { id: "maravilha", name: "Maravilha", slug: "maravilha" },
  { id: "primavera", name: "Primavera", slug: "primavera" },
  { id: "cavalhada", name: "Cavalhada", slug: "cavalhada" },
  { id: "amaralina", name: "Amaralina", slug: "amaralina" },
  { id: "shangri-la", name: "Shangri-lá", slug: "shangri-la" },
  { id: "lagoa-grande", name: "Lagoa Grande", slug: "lagoa-grande" },
  { id: "nova-brasilia", name: "Nova Brasília", slug: "nova-brasilia" },
  { id: "joao-paulo-ii", name: "João Paulo II", slug: "joao-paulo-ii" },
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string; next?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  let neighborhoods: NeighborhoodItem[] = FALLBACK_LAPA_NEIGHBORHOODS;
  let initialWhatsapp = "";
  let alreadyHasStore = false;
  let currentRole: string | null = null;
  let draftOwnerId: string | undefined;
  // Categoria da loja: categorias principais do portal (sem pai)
  let storeCategories = isSupabaseConfigured()
    ? []
    : FALLBACK_GLOBAL_CATEGORIES.filter((c) => !c.parent_id && c.is_active).map(
        (c) => ({ id: c.id, name: c.name })
      );

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    try {
      const { data: dbCategories } = await supabase
        .from("global_categories")
        .select("id, name")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (dbCategories) {
        storeCategories = dbCategories.map((c) => ({
          id: String(c.id),
          name: String(c.name),
        }));
      }
    } catch {
      // Sem categorias: o campo some e não bloqueia o cadastro
    }

    // 1. Carregar bairros dinamicamente de `public.neighborhoods`
    try {
      const { data: dbNeighborhoods } = await supabase
        .from("neighborhoods")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (dbNeighborhoods && dbNeighborhoods.length > 0) {
        neighborhoods = dbNeighborhoods.map((nb) => ({
          id: String(nb.id),
          name: String(nb.name),
          slug: nb.slug ? String(nb.slug) : undefined,
        }));
      }
    } catch {
      // Mantém a lista completa de bairros de Bom Jesus da Lapa
    }

    // 2. Verificar se o usuário já possui loja criada ou role definida
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      draftOwnerId = user.id;
      try {
        const { data: existingStore } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (existingStore) {
          alreadyHasStore = true;
        }
      } catch {
        alreadyHasStore = false;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("whatsapp, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.whatsapp) {
          initialWhatsapp = String(profile.whatsapp);
        }
        if (profile?.role) {
          currentRole = String(profile.role);
        }
      } catch {
        // Ignora erro caso perfil não tenha whatsapp salvo
      }
    }
  }

  if (alreadyHasStore) {
    redirect("/painel");
  }

  // Se o usuário já escolheu ser comprador e não pediu explicitamente tipo=merchant, segue para minha conta
  if (currentRole === "customer" && resolvedParams.tipo !== "merchant") {
    redirect(resolvedParams.next || "/minha-conta");
  }

  const initialStep: 0 | 1 =
    currentRole === "merchant" || resolvedParams.tipo === "merchant" ? 1 : 0;

  return (
    <OnboardingWizard
      neighborhoods={neighborhoods}
      initialWhatsapp={initialWhatsapp}
      initialStep={initialStep}
      nextPath={resolvedParams.next}
      draftOwnerId={draftOwnerId}
      storeCategories={storeCategories}
    />
  );
}

