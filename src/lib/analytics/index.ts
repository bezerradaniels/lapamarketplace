import catalog from "./events.json";
import type { BagItem } from "@/store/useBagStore";
import type { ProductItem } from "@/types/marketplace";

/**
 * Eventos de analytics enviados ao Google Tag Manager via `dataLayer`.
 * Os nomes seguem os eventos recomendados do GA4 sempre que existe um
 * equivalente (view_item, add_to_cart, search, login, sign_up, share...).
 * O catálogo completo fica em `events.json`.
 */

export type AnalyticsEventName = (typeof catalog.events)[number]["name"];

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
}

export const CURRENCY = "BRL";

const ECOMMERCE_EVENTS = new Set<string>(
  catalog.events.filter((e) => "ecommerce" in e && e.ecommerce).map((e) => e.name)
);

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

/** Envia um evento para o `dataLayer` do GTM. Nunca lança erro. */
export function trackEvent(
  name: AnalyticsEventName,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as DataLayerWindow;
    w.dataLayer = w.dataLayer || [];

    if (ECOMMERCE_EVENTS.has(name)) {
      const { items, value, currency, ...rest } = params as {
        items?: AnalyticsItem[];
        value?: number;
        currency?: string;
      } & Record<string, unknown>;
      // Limpa o objeto ecommerce anterior (recomendação do GA4 para o GTM)
      w.dataLayer.push({ ecommerce: null });
      w.dataLayer.push({
        event: name,
        ...rest,
        ecommerce: {
          currency: currency || CURRENCY,
          value: value ?? sumItems(items),
          items: items || [],
        },
      });
      return;
    }

    w.dataLayer.push({ event: name, ...params });
  } catch {
    // Analytics nunca pode quebrar a navegação
  }
}

function sumItems(items?: AnalyticsItem[]): number {
  if (!items) return 0;
  const total = items.reduce(
    (acc, i) => acc + (i.price || 0) * (i.quantity || 1),
    0
  );
  return Math.round(total * 100) / 100;
}

export function productToItem(
  product: ProductItem,
  options: { variant?: string | null; quantity?: number } = {}
): AnalyticsItem {
  const price =
    product.promotional_price != null &&
    product.promotional_price < product.price
      ? product.promotional_price
      : product.price;

  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.store?.name,
    item_category: product.category_slug || product.category_id,
    item_variant: options.variant || undefined,
    price,
    quantity: options.quantity ?? 1,
  };
}

export function bagItemToItem(item: BagItem, quantity?: number): AnalyticsItem {
  return {
    item_id: item.productId,
    item_name: item.name,
    item_brand: item.store?.name,
    item_variant: item.selectedSize,
    price: item.price,
    quantity: quantity ?? item.quantity,
  };
}

/** Nome do cookie usado para eventos que terminam em redirect do servidor. */
export const PENDING_EVENT_COOKIE = "lapa_pending_event";

/** Favoritar/desfavoritar produto (add_to_wishlist / remove_from_wishlist). */
export function trackSaveProduct(product: ProductItem, saved: boolean): void {
  if (saved) {
    trackEvent("add_to_wishlist", { items: [productToItem(product)] });
  } else {
    trackEvent("remove_from_wishlist", { item_id: product.id });
  }
}
