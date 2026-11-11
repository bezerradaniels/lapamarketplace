import React from "react";
import type { Metadata } from "next";
import { fetchBagBuyerContext } from "@/app/actions/checkout";
import { BagCheckoutClient } from "@/components/marketplace/BagCheckoutClient";

export const metadata: Metadata = {
  title: "Minha Sacola & Checkout via WhatsApp | LapaShop - Bom Jesus da Lapa",
  description:
    "Confira os produtos da sua sacola agrupados por loja e finalize seu pedido direto no WhatsApp das lojas de Bom Jesus da Lapa.",
};

export default async function SacolaPage() {
  const { buyerProfile, neighborhoods } = await fetchBagBuyerContext();

  return (
    <BagCheckoutClient
      buyerProfile={buyerProfile}
      neighborhoods={neighborhoods}
    />
  );
}

