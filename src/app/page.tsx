import React from "react";
import { getMarketplaceHomeData } from "@/app/actions/feed";
import { MarketplaceHomeClient } from "@/components/marketplace/MarketplaceHomeClient";

export default async function HomePage() {
  const data = await getMarketplaceHomeData();

  return (
    <MarketplaceHomeClient
      stories={data.stories}
      categories={data.categories}
      dailyOffers={data.dailyOffers}
      featuredStores={data.featuredStores}
      recentProducts={data.recentProducts}
      initialFeed={data.initialFeed}
      hasMoreFeed={data.hasMoreFeed}
      userId={data.userId}
      savedProductIds={data.savedProductIds}
    />
  );
}
