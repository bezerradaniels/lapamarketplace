"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  Store,
  MapPin,
  User,
  Phone,
  Home,
  LogOut,
  Sparkles,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  ExternalLink,
  LogIn,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        bagCount={bagCount}
        favoritesCount={savedProducts.length}
        onOpenFavorites={() => setActiveTab("favorites")}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Aviso caso esteja navegando como visitante sem login ativo */}
        {!isAuthenticated && (
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-[11px] font-bold">
                Modo Visitante {!isSupabaseReady && "• Pré-visualização Local"}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Entre na sua conta para sincronizar seus favoritos e endereço
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Com sua conta gratuita você salva peças favoritas e preenche a
                sacola em 1 clique em qualquer celular ou computador.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/login?next=/minha-conta">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<LogIn className="w-4 h-4" aria-hidden="true" />}
                >
                  Entrar / Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Cabeçalho do Perfil + CTA "Quero abrir minha loja no Lapa Marketplace" */}
        <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-extrabold shrink-0 shadow-xs">
              {(fullName || profile.full_name || "V")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                  {fullName || profile.full_name || "Minha Conta"}
                </h1>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
                  Cliente LapaShop
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                {profile.email || "Bom Jesus da Lapa - BA"}
              </p>
            </div>
          </div>

          {/* Ações do Topo: Botão Quero Abrir Minha Loja + Sair */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/15 transition-all"
            >
              <Store className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Quero abrir minha loja no Lapa Marketplace</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>

            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="md"
                isLoading={isSigningOut}
                onClick={handleSignOut}
                leftIcon={<LogOut className="w-4 h-4" aria-hidden="true" />}
              >
                Sair
              </Button>
            )}
          </div>
        </section>

        {/* Navegação em Pílulas das 3 Abas */}
        <nav
          aria-label="Seções da Minha Conta"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer touch-manipulation",
              activeTab === "favorites"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4",
                activeTab === "favorites" && "fill-rose-500 text-rose-500"
              )}
              aria-hidden="true"
            />
            <span>Meus Favoritos</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                activeTab === "favorites"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {savedProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stores")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer touch-manipulation",
              activeTab === "stores"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
            )}
          >
            <Store className="w-4 h-4" aria-hidden="true" />
            <span>Lojas que Sigo</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                activeTab === "stores"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {followedStores.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delivery")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer touch-manipulation",
              activeTab === "delivery"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
            )}
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span>Meus Dados de Entrega</span>
          </button>
        </nav>

        {/* CONTEÚDO DA ABA 1: MEUS FAVORITOS */}
        {activeTab === "favorites" && (
          <section aria-label="Meus Favoritos" className="space-y-4">
            {savedProducts.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 sm:p-14 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <Heart className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Você ainda não favoritou nenhuma peça
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Explore a vitrine de Bom Jesus da Lapa e toque no coração ❤️
                    nos produtos que você mais gostar para salvá-los aqui.
                  </p>
                </div>
                <Link href="/" className="inline-block pt-1">
                  <Button variant="primary" size="md">
                    Explorar produtos na vitrine
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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

        {/* CONTEÚDO DA ABA 2: LOJAS QUE SIGO */}
        {activeTab === "stores" && (
          <section aria-label="Lojas que Sigo" className="space-y-4">
            {followedStores.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 sm:p-14 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Store className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Você ainda não segue nenhuma loja
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Siga suas lojas preferidas de Bom Jesus da Lapa para
                    acompanhar novidades, stories e promoções relâmpago.
                  </p>
                </div>
                <Link href="/" className="inline-block pt-1">
                  <Button variant="primary" size="md">
                    Conhecer lojas da cidade
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followedStores.map((store) => (
                  <article
                    key={store.id}
                    className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <Link
                        href={`/loja/${store.slug}`}
                        className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/60"
                      >
                        {store.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={store.avatar_url}
                            alt={store.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Store
                            className="w-6 h-6 text-slate-400"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/loja/${store.slug}`}
                            className="text-base font-extrabold text-slate-900 hover:underline truncate"
                          >
                            {store.name}
                          </Link>
                          {store.is_verified && (
                            <BadgeCheck
                              className="w-4 h-4 text-blue-600 shrink-0"
                              aria-label="Loja verificada"
                            />
                          )}
                        </div>

                        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{store.neighborhood} • Bom Jesus da Lapa</span>
                        </p>

                        <div className="pt-1">
                          <StoreStatusBadge
                            compact
                            storeName={store.name}
                            businessHours={store.business_hours}
                            specialHours={store.special_hours}
                            isOpenOverride={store.is_open_override}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <Link href={`/loja/${store.slug}`} className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          rightIcon={
                            <ExternalLink
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          }
                        >
                          Ver catálogo da loja
                        </Button>
                      </Link>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isTogglingAction}
                        onClick={() => handleUnfollowStore(store.id)}
                        leftIcon={
                          <Trash2
                            className="w-3.5 h-3.5 text-rose-500"
                            aria-hidden="true"
                          />
                        }
                        className="text-slate-500 hover:text-rose-600"
                      >
                        Deixar de seguir
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CONTEÚDO DA ABA 3: MEUS DADOS DE ENTREGA */}
        {activeTab === "delivery" && (
          <section aria-label="Meus Dados de Entrega">
            <div className="max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Checkout Rápido na Sacola
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Meus Dados de Entrega em Bom Jesus da Lapa
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Deixe seu endereço e bairro salvos para preencher seus pedidos
                  na Sacola e no WhatsApp automaticamente sem precisar digitar
                  toda vez.
                </p>
              </div>

              {profileStatus && (
                <div
                  role={profileStatus.type === "error" ? "alert" : "status"}
                  className={cn(
                    "flex items-start gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-medium border",
                    profileStatus.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-700"
                  )}
                >
                  {profileStatus.type === "success" ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span>{profileStatus.text}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    name="full_name"
                    label="Seu nome completo"
                    placeholder="Ex: Maria Aparecida Souza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    leftIcon={<User className="w-4 h-4" aria-hidden="true" />}
                  />

                  <Input
                    name="whatsapp"
                    type="tel"
                    label="Seu WhatsApp (com DDD)"
                    placeholder="(77) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    helperText="Usado para o motoboy ou loja avisar sobre a entrega."
                    leftIcon={<Phone className="w-4 h-4" aria-hidden="true" />}
                  />
                </div>

                <Select
                  name="default_neighborhood_id"
                  label="Seu Bairro em Bom Jesus da Lapa"
                  value={neighborhoodId}
                  onChange={(e) => setNeighborhoodId(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" aria-hidden="true" />}
                  options={neighborhoods.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                  }))}
                />

                <Input
                  name="default_address"
                  label="Endereço padrão (Rua, Número e Ponto de Referência)"
                  placeholder="Ex: Rua Santa Luzia, nº 240, próximo à Praça da Fé"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  leftIcon={<Home className="w-4 h-4" aria-hidden="true" />}
                />

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Seus dados ficam salvos com segurança no seu perfil.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSavingProfile}
                  >
                    Salvar dados de entrega
                  </Button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

