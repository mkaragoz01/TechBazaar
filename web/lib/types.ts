export type Category = {
  _id: string;
  name: string;
  description?: string;
};

export type Brand = {
  _id: string;
  name: string;
  description?: string;
};

export type ProductAttributeValue = {
  attribute: string; // CategoryAttribute _id
  value: string;
};

export type Product = {
  _id: string;
  name: string;
  price: number; // kuruş
  description?: string;
  imgUrl?: string;
  stock?: number;
  sku?: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  brand?: string;
  categories: string[];
  date?: string;
  attributes?: ProductAttributeValue[];
  hasVariants?: boolean;
};

export type CategoryAttribute = {
  _id: string;
  category: string;
  name: string;
  valueType: "select" | "text";
  options: string[];
  unit?: string;
  isVariantAxis: boolean;
  isFilterable: boolean;
  sortOrder?: number;
};

// Populated form (attribute.name available) — what GET /api/cart and the
// admin variant list return; the plain ProductAttributeValue shape (just an
// id) is what gets submitted back to the server.
export type PopulatedAttributeValue = {
  attribute: { _id: string; name: string };
  value: string;
};

export type ProductVariant = {
  _id: string;
  product: string;
  sku?: string;
  attributes: PopulatedAttributeValue[];
  priceOverride?: number; // kuruş, absolute — not a delta
  stock: number;
  imgUrl?: string;
  isActive: boolean;
};

export type CartItem = {
  _id: string;
  name: string;
  price: number; // kuruş
  imgUrl?: string;
  quantity: number;
  stock?: number;
  variantId?: string;
  variantLabel?: string;
};

export type CartDiscount = {
  campaignName: string;
  amount: number; // kuruş
  code?: string;
};

export type CampaignConditionType = "product" | "productName" | "user" | "cartTotal";

export type CampaignCondition = {
  type: CampaignConditionType;
  field?: "sku" | "category" | "brand";
  operator: "in" | "gte" | "lte" | "contains";
  values?: string[];
  value?: number; // kuruş, for cartTotal
  text?: string; // for productName/contains
};

export type CampaignConditionGroup = {
  conditions: CampaignCondition[];
};

export type Campaign = {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  // Gruplardan biri tamamen sağlanırsa kampanya uygulanır (VEYA); bir
  // grubun içindeki tüm koşullar sağlanmalıdır (VE). Bu alandan önceki
  // (migrasyondan geçmemiş) kampanyalarda `conditionGroups` yerine düz bir
  // `conditions` dizisi bulunabilir — API bunu ham haliyle döndürür.
  conditionGroups?: CampaignConditionGroup[];
  conditions?: CampaignCondition[];
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: "matchingItems" | "cartTotal";
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  // Ana sayfa banner'ında hangi kampanyanın gösterileceğini belirler (yüksek
  // olan kazanır); eşitlikte discountValue'ya göre karar verilir.
  priority?: number;
};

export type Address = {
  _id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode?: string;
  isDefault: boolean;
};

export type PaymentMethod = {
  _id: string;
  cardHolderName: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
};

export type OrderItemProduct = {
  _id: string;
  name: string;
  price: number; // kuruş
  imgUrl?: string;
};

export type OrderItemVariant = {
  _id?: string;
  sku?: string;
  label?: string;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export type Order = {
  _id: string;
  status: OrderStatus;
  user?: {
    userId: string;
    name: string;
    email: string;
  };
  shippingAddress?: {
    title?: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    addressLine: string;
    postalCode?: string;
  };
  paymentDisplay?: string;
  discountAmount?: number; // kuruş
  campaignName?: string;
  items: {
    product: OrderItemProduct;
    variant?: OrderItemVariant;
    quantity: number;
    date?: string;
  }[];
  createdAt?: string;
};

export type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt?: string;
};

export type Role = {
  _id: string;
  name: string;
  isAdminRole: boolean;
  protected?: boolean;
};

export type AuditLogEntry = {
  _id: string;
  actor?: { id: string; name?: string; email?: string };
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
};

export type ErrorLogEntry = {
  _id: string;
  message?: string;
  stack?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: string;
  createdAt: string;
};

export type LogType = "audit" | "error";

export type DashboardKpis = {
  totalRevenue: number; // kuruş
  totalRevenueDeltaPct: number | null;
  totalOrders: number;
  orderCountDelta: number;
  avgOrderValue: number; // kuruş
  avgOrderValueDeltaPct: number | null;
  pendingCount: number;
  oldestPendingHours: number | null;
};

export type ChartPoint = { label: string; value: number }; // value in TL

export type DashboardChartData = {
  day: ChartPoint[];
  week: ChartPoint[];
  month: ChartPoint[];
  year: ChartPoint[];
};

export type DashboardTopProduct = {
  _id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number; // kuruş
};

export type DashboardLowStockProduct = {
  _id: string;
  name: string;
  stock: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  chart: DashboardChartData;
  topProducts: DashboardTopProduct[];
  recentOrders: Order[];
  lowStockProducts: DashboardLowStockProduct[];
  pendingOrders: Order[];
};
