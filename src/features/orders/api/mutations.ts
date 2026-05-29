import { createBrowserClient } from "@/lib/supabase";
import { toE164BR } from "@/lib/br";
import type { Order, OrderItem, OrderWithItems } from "@/types/domain";
import type { CartItem } from "@/features/cart";

export type CreateOrderInput = {
  storeId: string;
  customerName: string;
  customerPhone: string; // masked pt-BR
  customerNotes?: string;
  items: CartItem[];
  totalInCents: number;
  /** Optional coupon snapshot from the cart. The RPC revalidates and records usage. */
  coupon?: {
    id: string;
    code: string;
    discountInCents: number;
  } | null;
};

function catalogOrderErrorMessage(message: string): string {
  const messages: Record<string, string> = {
    store_unavailable: "A loja está indisponível no momento.",
    customer_name_invalid: "Informe um nome válido.",
    customer_phone_invalid: "Informe um WhatsApp válido.",
    customer_notes_too_long: "A observação está muito longa.",
    cart_empty: "Seu carrinho está vazio.",
    cart_too_large: "Seu carrinho tem muitos itens.",
    invalid_order_item: "Um item do pedido está inválido.",
    product_unavailable: "Um dos produtos não está mais disponível.",
    variation_required: "Selecione uma variação para continuar.",
    variation_unavailable: "Uma das variações selecionadas não está mais disponível.",
    insufficient_stock: "Não há estoque suficiente para finalizar este pedido.",
    coupon_not_found: "O cupom não está mais disponível.",
    coupon_expired: "O cupom expirou.",
    coupon_max_uses_reached: "O cupom atingiu o limite de uso.",
    coupon_min_subtotal_not_reached: "O pedido não atinge o valor mínimo do cupom.",
    coupon_category_not_eligible: "O cupom não é válido para os produtos selecionados.",
  };

  return messages[message] ?? message;
}

/**
 * Persists the order and its items before the WhatsApp hand-off.
 * Runs as anon under the `orders_public_insert` / `order_items_public_insert`
 * RLS policies (pending status only).
 *
 * If a coupon is provided we re-validate the discount server-side by clamping
 * to the actual subtotal, then call `record_coupon_usage` to bump usage.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<OrderWithItems> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc("create_catalog_order", {
    p_store_id: input.storeId,
    p_customer_name: input.customerName.trim(),
    p_customer_phone: toE164BR(input.customerPhone),
    p_customer_notes: input.customerNotes?.trim() || undefined,
    p_items: input.items.map((i) => ({
      product_id: i.product.id,
      quantity: i.quantity,
      selected_variation: i.selectedVariation ?? undefined,
    })),
    p_coupon_id: input.coupon?.id ?? undefined,
  });

  if (error) throw new Error(catalogOrderErrorMessage(error.message));
  return data as unknown as OrderWithItems;
}

export type ManualOrderItem = {
  productId: string;
  productName: string;
  priceInCents: number;
  quantity: number;
};

export type CreateManualOrderInput = {
  storeId: string;
  customerName: string;
  customerPhone: string; // raw Brazilian format or E.164
  sellerId?: string | null;
  items: ManualOrderItem[];
};

/** Creates an order from the dashboard (owner/seller context, authenticated). */
export async function createManualOrder(
  input: CreateManualOrderInput,
): Promise<OrderWithItems> {
  const supabase = createBrowserClient();

  const total = input.items.reduce(
    (sum, i) => sum + i.priceInCents * i.quantity,
    0,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderPayload: any = {
    store_id: input.storeId,
    status: "pending",
    source: "manual",
    customer_name: input.customerName.trim(),
    customer_phone: toE164BR(input.customerPhone),
    customer_notes: null,
    total_in_cents: total,
    discount_in_cents: 0,
    seller_id: input.sellerId ?? null,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("*")
    .single();

  if (orderError || !order)
    throw orderError ?? new Error("Failed to create order");

  const rows = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    product_name: i.productName,
    price_in_cents: i.priceInCents,
    quantity: i.quantity,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .insert(rows)
    .select("*");

  if (itemsError) throw itemsError;

  return { ...(order as Order), items: (items ?? []) as OrderItem[] };
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Failed to update order");
  return data as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) throw error;
}
