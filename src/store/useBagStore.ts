"use client";

import { useSyncExternalStore } from "react";
import type { ProductItem } from "@/types/marketplace";
import { bagItemToItem, trackEvent } from "@/lib/analytics";

export const BAG_STORAGE_KEY = "lapa-marketplace-bag";

export interface BagItem {
  cartItemId: string; // product.id + selectedSize
  productId: string;
  name: string;
  slug: string;
  price: number; // Usa promotional_price se existir, senão price
  originalPrice: number;
  imageUrl: string;
  selectedSize?: string;
  quantity: number;
  store: {
    id: string;
    name: string;
    slug: string;
    whatsappNumber: string;
    acceptedPayments: string[];
    installmentInfo?: string | null;
    deliveryOptions: string[];
    deliveryFeeType: "free" | "fixed" | "combine";
    fixedDeliveryFee: number;
  };
}

export interface BagStoreState {
  items: BagItem[];
  addItem: (
    item: Omit<BagItem, "cartItemId" | "quantity"> & {
      cartItemId?: string;
      quantity?: number;
    }
  ) => void;
  addProduct: (
    product: ProductItem,
    selectedSize?: string | null,
    quantity?: number
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearStoreItems: (storeId: string) => void;
  clearAll: () => void;
}

type Listener = () => void;

let memoryItems: BagItem[] = [];
let hydratedFromStorage = false;
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function readFromStorage(): BagItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as BagItem[];
    }
    if (parsed && Array.isArray(parsed.state?.items)) {
      return parsed.state.items as BagItem[];
    }
    return [];
  } catch {
    return [];
  }
}

function writeToStorage(items: BagItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      BAG_STORAGE_KEY,
      JSON.stringify({ state: { items }, version: 1 })
    );
  } catch {
    // Falha silenciosa caso o navegador bloqueie escrita
  }
}

function ensureHydrated() {
  if (typeof window !== "undefined" && !hydratedFromStorage) {
    hydratedFromStorage = true;
    memoryItems = readFromStorage();
  }
}

function setItems(updater: (prev: BagItem[]) => BagItem[]) {
  ensureHydrated();
  memoryItems = updater(memoryItems);
  writeToStorage(memoryItems);
  emitChange();
}

export function buildBagItemFromProduct(
  product: ProductItem,
  selectedSize?: string | null,
  quantity = 1
): BagItem {
  const chosenSize =
    selectedSize ??
    (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
  const cartItemId = `${product.id}::${chosenSize || "unico"}`;

  const effectivePrice =
    product.promotional_price != null &&
      product.promotional_price < product.price
      ? product.promotional_price
      : product.price;

  const deliveryOptions: string[] = [];
  if (product.store.has_delivery !== false) {
    deliveryOptions.push("delivery");
  }
  if (product.store.has_pickup !== false) {
    deliveryOptions.push("pickup");
  }
  if (deliveryOptions.length === 0) {
    deliveryOptions.push("delivery", "pickup");
  }

  const acceptedPayments =
    product.store.payment_methods && product.store.payment_methods.length > 0
      ? product.store.payment_methods
      : ["pix", "credit_card", "cash"];

  return {
    cartItemId,
    productId: product.id,
    name: product.title,
    slug: product.slug || product.id,
    price: effectivePrice,
    originalPrice: product.price,
    imageUrl: product.image_url,
    selectedSize: chosenSize || undefined,
    quantity: Math.max(1, quantity),
    store: {
      id: product.store.id,
      name: product.store.name,
      slug: product.store.slug,
      whatsappNumber: product.store.whatsapp || "5577999112233",
      acceptedPayments,
      installmentInfo: product.store.installment_info ?? null,
      deliveryOptions,
      deliveryFeeType: product.store.delivery_fee_type || "combine",
      fixedDeliveryFee: Number(product.store.delivery_fee || 0),
    },
  };
}

const storeActions: Omit<BagStoreState, "items"> = {
  addItem: (incoming) => {
    const cartItemId =
      incoming.cartItemId ||
      `${incoming.productId}::${incoming.selectedSize || "unico"}`;
    const addQty = Math.max(1, incoming.quantity ?? 1);
    trackEvent("add_to_cart", {
      items: [bagItemToItem({ ...incoming, cartItemId, quantity: addQty })],
    });

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      }
      return [
        ...prev,
        {
          ...incoming,
          cartItemId,
          quantity: addQty,
        },
      ];
    });
  },

  addProduct: (product, selectedSize, quantity = 1) => {
    const bagItem = buildBagItemFromProduct(product, selectedSize, quantity);
    storeActions.addItem(bagItem);
  },

  removeItem: (cartItemId) => {
    ensureHydrated();
    const removed = memoryItems.find((i) => i.cartItemId === cartItemId);
    if (removed) {
      trackEvent("remove_from_cart", { items: [bagItemToItem(removed)] });
    }
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      storeActions.removeItem(cartItemId);
      return;
    }
    ensureHydrated();
    const current = memoryItems.find((i) => i.cartItemId === cartItemId);
    if (current && quantity !== current.quantity) {
      const diff = quantity - current.quantity;
      trackEvent(diff > 0 ? "add_to_cart" : "remove_from_cart", {
        items: [bagItemToItem(current, Math.abs(diff))],
      });
    }
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      )
    );
  },

  clearStoreItems: (storeId) => {
    setItems((prev) => prev.filter((i) => i.store.id !== storeId));
  },

  clearAll: () => {
    setItems(() => []);
  },
};

function subscribe(listener: Listener) {
  listeners.add(listener);

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === BAG_STORAGE_KEY) {
      memoryItems = readFromStorage();
      emitChange();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

let cachedSnapshotItems: BagItem[] = [];
let cachedSnapshotState: BagStoreState = {
  items: cachedSnapshotItems,
  ...storeActions,
};

function getClientSnapshot(): BagStoreState {
  ensureHydrated();
  if (cachedSnapshotItems !== memoryItems) {
    cachedSnapshotItems = memoryItems;
    cachedSnapshotState = {
      items: memoryItems,
      ...storeActions,
    };
  }
  return cachedSnapshotState;
}

const serverSnapshotState: BagStoreState = {
  items: [],
  ...storeActions,
};

function getServerSnapshot(): BagStoreState {
  return serverSnapshotState;
}

/**
 * Hook global da Sacola Multi-Lojista compatível com a API do Zustand + persist (`localStorage`).
 */
export function useBagStore(): BagStoreState;
export function useBagStore<T>(selector: (state: BagStoreState) => T): T;
export function useBagStore<T>(selector?: (state: BagStoreState) => T) {
  const state = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  return selector ? selector(state) : state;
}

useBagStore.getState = (): BagStoreState => getClientSnapshot();

const emptySubscribe = () => () => { };

/**
 * Hook de segurança contra Hydration Mismatch ao ler dados do `localStorage` no cliente.
 */
export function useBagHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
