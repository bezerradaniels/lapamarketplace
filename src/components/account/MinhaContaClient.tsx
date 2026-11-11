"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import {
  Button,
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Switch";
import { LapaSymbol, VerifiedSeal } from "@/components/brand/LapaSymbol";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import {
  toggleSaveProduct,
  toggleFollowStore,
  updateCustomerProfile,
} from "@/app/actions/social";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import type {
  CustomerProfile,
  NeighborhoodItem,
  ProductItem,
  StoreSummary,
} from "@/types/marketplace";

export type AccountTab = "favorites" | "stores" | "delivery";

export interface MinhaContaClientProps {
  isAuthenticated: boolean;
  isSupabaseReady: boolean;
  profile: CustomerProfile;
  initialSavedProducts: ProductItem[];
  initialFollowedStores: StoreSummary[];
  neighborhoods: NeighborhoodItem[];
  initialTab?: AccountTab;
}

export function MinhaContaClient({
  isAuthenticated,
  isSupabaseReady,
  profile,
  initialSavedProducts,
  initialFollowedStores,
  neighborhoods,
  initialTab = "favorites",
}: MinhaContaClientProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [savedProducts, setSavedProducts] =
    useState<ProductItem[]>(initialSavedProducts);
  const [followedStores, setFollowedStores] = useState<StoreSummary[]>(
    initialFollowedStores
  );
  const [bagCount, setBagCount] = useState<number>(0);

  // Estado do formulário de Dados de Entrega
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || "");
  const [neighborhoodId, setNeighborhoodId] = useState(
    profile.default_neighborhood_id || (neighborhoods[0]?.id ?? "")
  );
  const [defaultAddress, setDefaultAddress] = useState(
    profile.default_address || ""
  );

  const [profileStatus, setProfileStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSavingProfile, startProfileTransition] = useTransition();
  const [isTogglingAction, startActionTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();

  const handleToggleFavorite = (product: ProductItem) => {
    // Atualização otimista na UI
    setSavedProducts((prev) => prev.filter((p) => p.id !== product.id));

    startActionTransition(async () => {
      await toggleSaveProduct(product.id);
    });
  };

  const handleUnfollowStore = (storeId: string) => {
    setFollowedStores((prev) => prev.filter((s) => s.id !== storeId));

    startActionTransition(async () => {
      await toggleFollowStore(storeId);
    });
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileStatus(null);

    const formData = new FormData(e.currentTarget);

    startProfileTransition(async () => {
      const result = await updateCustomerProfile(formData);
      if (result.error) {
        setProfileStatus({ type: "error", text: result.error });
      } else if (result.success) {
        setProfileStatus({
          type: "success",
          text:
            result.message ||
            "Dados de entrega atualizados com sucesso!",
        });
      }
    });
  };

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      await signOut();
    });
  };

  const displayName = fullName || profile.full_name || "Minha conta";
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "L";

  const emptyState = (title: string, text: string, cta: string) => (
    <div className="rounded-[28px] bg-white p-8 text-center flex flex-col items-center gap-3 max-w-lg mx-auto">
      <h2 className="text-[19px] font-extrabold text-slate-900 text-balance">
        {title}
      </h2>
      <p className="text-sm text-slate-500 leading-normal">{text}</p>
      <Link
        href="/"
        className={cn(
          buttonBaseClasses,
          buttonVariantClasses.primary,
          buttonSizeClasses.md
        )}
      >
        {cta}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        mobileVariant="hidden"
        bagCount={bagCount}
        favoritesCount={savedProducts.length}
        onOpenFavorites={() => setActiveTab("favorites")}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-5 md:px-6 lg:px-8 pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-8 pb-32 md:pb-12">
        {/* Perfil */}
        <div className="flex items-center gap-3.5 pb-5">
          <span className="w-15 h-15 rounded-full bg-brand-soft grid place-items-center font-display text-[22px] font-extrabold text-slate-900 shrink-0">
            {initials}
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <h1 className="text-xl md:text-[30px] font-extrabold tracking-[-0.02em] md:tracking-[-0.03em] text-slate-900 truncate">
              {displayName}
            </h1>
            <span className="text-[13px] text-slate-500 truncate">
              {profile.email || "Bom Jesus da Lapa - BA"}
            </span>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sair da conta"
              className="w-10.5 h-10.5 rounded-[14px] bg-white grid place-items-center text-slate-900 shrink-0 cursor-pointer transition-transform duration-150 active:scale-95 disabled:opacity-55"
            >
              {isSigningOut ? (
                <Loader2 className="w-4.75 h-4.75 animate-spin" />
              ) : (
                <LogOut className="w-4.75 h-4.75" strokeWidth={1.8} />
              )}
            </button>
          ) : (
            <Link
              href="/login?next=/minha-conta"
              className={cn(
                buttonBaseClasses,
                buttonVariantClasses.primary,
                buttonSizeClasses.md,
                "shrink-0"
              )}
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Aviso de visitante */}
        {!isAuthenticated && (
          <div className="mb-4.5 rounded-[18px] bg-amber-100 px-4 py-3 text-[13px] text-amber-800">
            <span className="font-semibold">
              Você está como visitante
              {!isSupabaseReady && " (pré-visualização local)"}.
            </span>{" "}
            Entre na sua conta para salvar favoritos e preencher a sacola em um
            toque.
          </div>
        )}

        {/* Abas */}
        <Segmented
          ariaLabel="Seções da minha conta"
          className="mb-4.5 md:max-w-md"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "favorites", label: "Favoritos" },
            { value: "stores", label: "Lojas" },
            { value: "delivery", label: "Entrega" },
          ]}
        />

        {/* Favoritos */}
        {activeTab === "favorites" && (
          <section aria-label="Meus favoritos" className="pb-5">
            {savedProducts.length === 0 ? (
              emptyState(
                "Você ainda não favoritou nada",
                "Toque no coração dos produtos que gostar para guardá-los aqui.",
                "Explorar produtos"
              )
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {savedProducts.map((product) => (
                  <ProductCardGrid
                    key={product.id}
                    product={product}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite(product)}
                    onAddToBag={() => setBagCount((c) => c + 1)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Lojas que sigo */}
        {activeTab === "stores" && (
          <section aria-label="Lojas que sigo" className="pb-5">
            {followedStores.length === 0 ? (
              emptyState(
                "Você ainda não segue nenhuma loja",
                "Siga suas lojas preferidas de Bom Jesus da Lapa para acompanhar novidades, stories e promoções.",
                "Conhecer lojas"
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {followedStores.map((store) => {
                  const isPremium =
                    store.plan === "premium" || store.plan === "pro";
                  return (
                    <article
                      key={store.id}
                      className="rounded-3xl bg-white p-3 flex items-center gap-3"
                    >
                      <Link
                        href={`/loja/${store.slug}`}
                        className={cn(
                          "flex-none w-13 h-13 rounded-full p-0.5",
                          isPremium ? "bg-story-premium" : "bg-brand"
                        )}
                      >
                        <span className="w-full h-full rounded-full bg-brand-soft ring-2 ring-white overflow-hidden grid place-items-center font-display text-sm font-extrabold text-slate-900">
                          {store.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={store.avatar_url}
                              alt={store.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            store.name.slice(0, 2).toUpperCase()
                          )}
                        </span>
                      </Link>

                      <div className="min-w-0 flex-1 flex flex-col gap-0.5 items-start">
                        <div className="flex items-center gap-1.5 max-w-full">
                          <Link
                            href={`/loja/${store.slug}`}
                            className="font-display text-[15px] font-bold text-slate-900 truncate"
                          >
                            {store.name}
                          </Link>
                          {store.is_verified && <VerifiedSeal size={16} />}
                        </div>
                        <span className="text-xs text-slate-500 truncate max-w-full">
                          {store.neighborhood}
                        </span>
                        <StoreStatusBadge
                          compact
                          className="mt-0.5"
                          storeName={store.name}
                          businessHours={store.business_hours}
                          specialHours={store.special_hours}
                          isOpenOverride={store.is_open_override}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Link
                          href={`/loja/${store.slug}`}
                          className="px-3 py-2.25 rounded-xl bg-slate-100 hover:bg-slate-200 font-display text-xs font-bold text-slate-900 text-center transition-colors duration-150"
                        >
                          Ver loja
                        </Link>
                        <button
                          type="button"
                          disabled={isTogglingAction}
                          onClick={() => handleUnfollowStore(store.id)}
                          className="text-xs text-slate-500 underline hover:text-slate-900 cursor-pointer disabled:opacity-55"
                        >
                          Deixar de seguir
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Dados de entrega */}
        {activeTab === "delivery" && (
          <section aria-label="Meus dados de entrega" className="pb-5">
            <div className="max-w-2xl rounded-[28px] bg-white p-4 md:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-[19px] font-extrabold text-slate-900">
                  Dados de entrega
                </h2>
                <p className="text-[13px] text-slate-500 leading-normal">
                  Ficam salvos para preencher a sacola e o pedido no WhatsApp
                  sem você digitar de novo.
                </p>
              </div>

              {profileStatus && (
                <div
                  role={profileStatus.type === "error" ? "alert" : "status"}
                  className={cn(
                    "rounded-[18px] px-4 py-3 text-[13px] font-semibold",
                    profileStatus.type === "success"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-700"
                  )}
                >
                  {profileStatus.text}
                </div>
              )}

              <form
                onSubmit={handleProfileSubmit}
                className="flex flex-col gap-3.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    name="full_name"
                    label="Nome completo"
                    placeholder="Maria Aparecida Souza"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    name="whatsapp"
                    type="tel"
                    label="WhatsApp com DDD"
                    placeholder="(77) 99999-9999"
                    autoComplete="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>

                <Select
                  name="default_neighborhood_id"
                  label="Bairro"
                  value={neighborhoodId}
                  onChange={(e) => setNeighborhoodId(e.target.value)}
                  options={neighborhoods.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                  }))}
                />

                <Input
                  name="default_address"
                  label="Endereço e ponto de referência"
                  placeholder="Rua Santa Luzia, 240 · perto da praça"
                  autoComplete="street-address"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-1 sm:self-start"
                  isLoading={isSavingProfile}
                >
                  Salvar dados de entrega
                </Button>
              </form>
            </div>
          </section>
        )}

        {/* CTA para lojistas */}
        <div className="p-5 md:p-7 rounded-[28px] bg-brand-soft flex flex-col gap-3">
          <LapaSymbol size={36} />
          <span className="font-display text-xl md:text-2xl font-extrabold tracking-[-0.02em] leading-[1.15] text-slate-900 text-balance">
            Tem uma loja em Lapa? Crie seu catálogo grátis.
          </span>
          <Link
            href="/onboarding"
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.primary,
              buttonSizeClasses.md,
              "self-start px-4.5"
            )}
          >
            Quero abrir minha loja
          </Link>
        </div>
      </main>

    </div>
  );
}
