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
      storeShowcases={data.storeShowcases}
      followedStoreIds={data.followedStoreIds}
      recentProducts={data.recentProducts}
      initialFeed={data.initialFeed}
      hasMoreFeed={data.hasMoreFeed}
      userId={data.userId}
      savedProductIds={data.savedProductIds}
      neighborhoods={data.neighborhoods}
    />
  );
}
