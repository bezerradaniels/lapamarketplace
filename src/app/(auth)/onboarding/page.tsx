import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
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

export default async function OnboardingPage() {
  let neighborhoods: NeighborhoodItem[] = FALLBACK_LAPA_NEIGHBORHOODS;
  let initialWhatsapp = "";
  let alreadyHasStore = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

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

    // 2. Verificar se o lojista já possui loja criada
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
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
          .select("whatsapp")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.whatsapp) {
          initialWhatsapp = String(profile.whatsapp);
        }
      } catch {
        // Ignora erro caso perfil não tenha whatsapp salvo
      }
    }
  }

  if (alreadyHasStore) {
    redirect("/painel");
  }

  return (
    <OnboardingWizard
      neighborhoods={neighborhoods}
      initialWhatsapp={initialWhatsapp}
    />
  );
}

