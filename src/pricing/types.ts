export type PricingItem = {
  name: string;
  unit: string;
  price: number;
  priceLabel: string;
  materialNote: "별도" | null;
};

export type PricingCategory = {
  id: string;
  title: string;
  note?: string;
  items: PricingItem[];
};

export type ServicePricingConfig = {
  servicePath: string;
  serviceName: string;
  pricingPagePath: string;
  categories: PricingCategory[];
  disclaimer: string;
};
