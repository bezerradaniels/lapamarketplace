/**
 * Regras de exibição do tema Aura (card de produto v2, post do feed v2, card de loja v2).
 *
 * Derivadas dos dados que já chegam ao cliente (`ProductItem` / `StoreSummary`),
 * na mesma linha do `StoreStatusBadge`: o horário é calculado em America/Bahia.
 */
import { getStoreOpenStatus } from "@/lib/store-hours";
import { formatCurrencyBRL } from "@/lib/utils";
import type { PaymentMethod, ProductItem, StoreSummary } from "@/types/marketplace";

const NEW_PRODUCT_DAYS = 7;
const NEW_STORE_DAYS = 30;
const MIN_DISCOUNT = 5;
const DELIVERY_TODAY_MIN_MINUTES = 60;

export type StatusTone = "open" | "alert" | "closed";

export interface StoreStatusLine {
  tone: StatusTone;
  /** "Aberta · fecha às 18h", "Fechada · abre seg às 8h" */
  label: string;
  /** "Aberta até 18h" (linha do feed) */
  short: string;
}

export interface Perk {
  label: string;
  tone: "success" | "sky";
}

/** "18:00" → "18h", "18:30" → "18h30", "08:00" → "8h" */
export function formatHour(time?: string | null): string | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  return m[2] === "00" ? `${h}h` : `${h}h${m[2]}`;
}

function bahiaMinutesNow(now = new Date()): number {
  const local = new Date(now.toLocaleString("en-US", { timeZone: "America/Bahia" }));
  return local.getHours() * 60 + local.getMinutes();
}

function toMinutes(time?: string | null): number | null {
  const m = time ? /^(\d{1,2}):(\d{2})/.exec(time.trim()) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const SHORT_DAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type StoreHoursInput = Pick<
  StoreSummary,
  "business_hours" | "special_hours" | "is_open_override"
>;

/** Status da loja em texto, com o próximo horário de abertura quando fechada. */
export function storeStatusLine(store: StoreHoursInput): StoreStatusLine & {
  minutesToClose: number | null;
} {
  const status = getStoreOpenStatus({
    businessHours: store.business_hours,
    specialHours: store.special_hours,
    isOpenOverride: store.is_open_override,
  });

  const closeMatch = /(\d{1,2}:\d{2})/.exec(status.detailText);
  const closeTime = closeMatch?.[1] ?? null;

  if (status.state === "open" || status.state === "closing_soon") {
    const close = /fecha|até/i.test(status.detailText) ? formatHour(closeTime) : null;
    const closeMin = toMinutes(closeTime);
    const minutesToClose =
      closeMin != null && /fecha|até/i.test(status.detailText)
        ? closeMin - bahiaMinutesNow()
        : null;
    if (status.state === "closing_soon") {
      const label = close ? `Fecha logo · às ${close}` : "Fecha logo";
      return { tone: "alert", label, short: label, minutesToClose };
    }
    return {
      tone: "open",
      label: close ? `Aberta · fecha às ${close}` : "Aberta agora",
      short: close ? `Aberta até ${close}` : "Aberta agora",
      minutesToClose,
    };
  }

  if (status.state === "lunch") {
    const back = formatHour(closeTime);
    const label = back ? `Almoço · volta às ${back}` : "Horário de almoço";
    return { tone: "alert", label, short: label, minutesToClose: null };
  }

  // Fechada: procurar a próxima abertura (hoje mais tarde ou nos próximos dias)
  const opensToday = /abre hoje/i.test(status.detailText)
    ? formatHour(closeTime)
    : null;
  let opens: string | null = opensToday ? `às ${opensToday}` : null;

  if (!opens && store.is_open_override !== false) {
    const week = status.weeklySchedule;
    const todayIdx = week.findIndex((d) => d.isToday);
    if (todayIdx >= 0) {
      for (let step = 1; step <= 7; step++) {
        const day = week[(todayIdx + step) % 7];
        if (!day.isClosed) {
          const hour = formatHour(day.hoursText.split(" ")[0]);
          if (hour) {
            const when = step === 1 ? "amanhã" : SHORT_DAY[day.dayOfWeek];
            opens = `${when} às ${hour}`;
          }
          break;
        }
      }
    }
  }

  const label = opens ? `Fechada · abre ${opens}` : "Fechada";
  return { tone: "closed", label, short: label, minutesToClose: null };
}

export function discountLabel(price: number, promo?: number | null): string | null {
  if (promo == null || promo >= price || price <= 0) return null;
  const pct = Math.round((1 - promo / price) * 100);
  return pct >= MIN_DISCOUNT ? `−${pct}%` : null;
}

export function isRecent(createdAt: string | undefined, days: number, now = new Date()): boolean {
  if (!createdAt) return false;
  const diff = (now.getTime() - new Date(createdAt).getTime()) / 86_400_000;
  return diff >= 0 && diff <= days;
}

export const isNewProduct = (p: Pick<ProductItem, "created_at">) =>
  isRecent(p.created_at, NEW_PRODUCT_DAYS);

export const isNewStore = (s: Pick<StoreSummary, "created_at">) =>
  isRecent(s.created_at, NEW_STORE_DAYS);

function deliversToday(minutesToClose: number | null, tone: StatusTone) {
  return tone === "open" && (minutesToClose == null || minutesToClose > DELIVERY_TODAY_MIN_MINUTES);
}

/** Um só benefício, na prioridade: Frete grátis › Entrega hoje › Retire hoje. */
export function perkFor(store: StoreSummary, status = storeStatusLine(store)): Perk | null {
  if (store.has_delivery && store.delivery_fee_type === "free") {
    return { label: "Frete grátis", tone: "success" };
  }
  if (store.has_delivery && deliversToday(status.minutesToClose, status.tone)) {
    return { label: "Entrega hoje", tone: "success" };
  }
  if (store.has_pickup && status.tone !== "closed") {
    return { label: "Retire hoje", tone: "sky" };
  }
  return null;
}

/** Linha de entrega do catálogo e do feed. */
export function shippingFor(
  store: StoreSummary,
  status = storeStatusLine(store)
): { label: string; free: boolean } | null {
  if (store.has_delivery) {
    if (store.delivery_fee_type === "free") {
      return { label: `Frete grátis no ${store.neighborhood || "bairro"}`, free: true };
    }
    const when = deliversToday(status.minutesToClose, status.tone)
      ? "Entrega hoje · "
      : "";
    const fee =
      store.delivery_fee_type === "fixed" && store.delivery_fee
        ? when
          ? formatCurrencyBRL(store.delivery_fee)
          : `Entrega ${formatCurrencyBRL(store.delivery_fee)}`
        : when
          ? "taxa a combinar"
          : "Taxa a combinar";
    const pickup = store.has_pickup ? " · ou retire na loja" : "";
    return { label: `${when}${fee}${pickup}`, free: false };
  }
  if (store.has_pickup) return { label: "Retirada na loja", free: false };
  return null;
}

/** Número máximo de parcelas, se a loja aceita cartão e informou parcelamento. */
export function maxInstallments(store: StoreSummary): number | null {
  const accepts = store.payment_methods?.includes("credit_card") ?? false;
  const m = store.installment_info ? /(\d{1,2})\s*x/i.exec(store.installment_info) : null;
  if (!accepts || !m) return null;
  const n = Number(m[1]);
  return n >= 2 ? n : null;
}

/**
 * "ou 3x de R$ 53,30" — só quando a loja informa parcelamento sem juros
 * (com acréscimo o valor da parcela seria outro, então não mostramos).
 */
export function installmentsFor(store: StoreSummary, finalPrice: number): string | null {
  const n = maxInstallments(store);
  if (!n || !/sem juros/i.test(store.installment_info ?? "")) return null;
  return `ou ${n}x de ${formatCurrencyBRL(Math.ceil((finalPrice / n) * 100) / 100)}`;
}

const PAYMENT_LABEL: Partial<Record<PaymentMethod, string>> = {
  pix: "Pix",
  credit_card: "Cartão",
  cash: "Dinheiro",
  crediario: "Crediário",
};

export type StoreChip = { label: string; tone: "success" | "sky" | "neutral" };

/** Chips do card de loja: 1 de entrega + até 2 de pagamento (Pix primeiro). */
export function storeChips(store: StoreSummary, status = storeStatusLine(store)): StoreChip[] {
  const chips: StoreChip[] = [];
  if (store.has_delivery && store.delivery_fee_type === "free") {
    chips.push({ label: "Frete grátis", tone: "success" });
  } else if (store.has_delivery && deliversToday(status.minutesToClose, status.tone)) {
    chips.push({ label: "Entrega hoje", tone: "success" });
  } else if (!store.has_delivery && store.has_pickup && status.tone !== "closed") {
    chips.push({ label: "Retire hoje", tone: "sky" });
  } else if (store.has_delivery) {
    chips.push({ label: "Entrega", tone: "neutral" });
  } else if (store.has_pickup) {
    chips.push({ label: "Retirada", tone: "neutral" });
  }

  const methods = store.payment_methods ?? [];
  const pay: string[] = [];
  if (methods.includes("pix")) pay.push("Pix");
  const n = maxInstallments(store);
  if (n) pay.push(`Até ${n}x`);
  for (const m of ["credit_card", "cash", "crediario"] as PaymentMethod[]) {
    if (pay.length >= 2) break;
    if (m === "credit_card" && n) continue;
    if (methods.includes(m) && PAYMENT_LABEL[m]) pay.push(PAYMENT_LABEL[m]!);
  }
  for (const label of pay.slice(0, 2)) chips.push({ label, tone: "neutral" });
  return chips.slice(0, 3);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "L";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Preço final e preço "de" de um produto. */
export function priceOf(p: Pick<ProductItem, "price" | "promotional_price">) {
  const hasPromo = p.promotional_price != null && p.promotional_price < p.price;
  return {
    final: hasPromo ? p.promotional_price! : p.price,
    compareAt: hasPromo ? p.price : null,
  };
}

/** Classes do texto/ponto por tom de status (Aura). */
export const STATUS_TONE: Record<StatusTone, { text: string; dot: string }> = {
  open: { text: "text-mint-ink", dot: "bg-whatsapp" },
  alert: { text: "text-amber-ink", dot: "bg-premium" },
  closed: { text: "text-slate-600", dot: "bg-slate-400" },
};
