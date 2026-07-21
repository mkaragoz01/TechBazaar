import { serverFetch } from "./server-api";
import type {
  Category,
  Brand,
  Product,
  CartItem,
  CartDiscount,
  Order,
  Address,
  PaymentMethod,
  Campaign,
  DashboardData,
  AdminUser,
  Role,
  AuditLogEntry,
  ErrorLogEntry,
  LogType,
  CategoryAttribute,
  ProductVariant,
} from "./types";

export type { Category, Brand, Product, CartItem, CartDiscount, Order, Address, PaymentMethod, Campaign, DashboardData, AdminUser, Role, AuditLogEntry, ErrorLogEntry, LogType, CategoryAttribute, ProductVariant };

export type HomeData = {
  products: Product[];
  categories: Category[];
  selectedSort: string;
  campaign: { name: string; description?: string } | null;
};

export async function getHomeData(sort?: string): Promise<HomeData> {
  const params = sort ? `?sort=${encodeURIComponent(sort)}` : "";
  return serverFetch<HomeData>(`/api/home${params}`);
}

export type ProductsData = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  selectedSort: string;
  selectedCategory?: string;
  selectedBrand?: string;
  selectedAttributes?: Record<string, string | string[]>;
};

export async function getProducts(params: {
  sort?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
  // attributeId -> selected value(s) — turns into ?attr[id]=v1&attr[id]=v2
  attr?: Record<string, string[]>;
}): Promise<ProductsData> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.category) search.set("category", params.category);
  if (params.brand) search.set("brand", params.brand);
  if (params.minPrice) search.set("minPrice", params.minPrice);
  if (params.maxPrice) search.set("maxPrice", params.maxPrice);
  if (params.q) search.set("q", params.q);
  if (params.attr) {
    for (const [attributeId, values] of Object.entries(params.attr)) {
      for (const value of values) {
        search.append(`attr[${attributeId}]`, value);
      }
    }
  }
  const qs = search.toString();
  return serverFetch<ProductsData>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(productId: string): Promise<{
  product: Product;
  categoryName?: string;
  brandName?: string;
  relatedProducts: Product[];
  variants: ProductVariant[];
}> {
  return serverFetch(`/api/products/${productId}`);
}

export async function getCart(): Promise<{ items: CartItem[]; discount: CartDiscount | null }> {
  return serverFetch(`/api/cart`);
}

export async function getCartCount(): Promise<{ count: number }> {
  return serverFetch(`/api/cart/count`);
}

export async function getOrders(): Promise<{ orders: Order[] }> {
  return serverFetch(`/api/orders`);
}

export type FilterKind = "newest" | "favorites" | "premium";

export async function getFilteredProducts(kind: FilterKind): Promise<{
  products: Product[];
  categories: Category[];
}> {
  return serverFetch(`/api/filter/${kind}`);
}

export async function getResetToken(token: string): Promise<{
  userId: string;
  passwordToken: string;
}> {
  return serverFetch(`/api/auth/reset-password/${token}`);
}

export async function getAdminProducts(): Promise<{ products: Product[] }> {
  return serverFetch(`/api/admin/products`);
}

export async function getAdminProduct(productId: string): Promise<{ product: Product }> {
  return serverFetch(`/api/admin/products/${productId}`);
}

export async function getAdminCategories(): Promise<{ categories: Category[] }> {
  return serverFetch(`/api/admin/categories`);
}

export async function getAdminCategory(categoryId: string): Promise<{ category: Category }> {
  return serverFetch(`/api/admin/categories/${categoryId}`);
}

export async function getAdminBrands(): Promise<{ brands: Brand[] }> {
  return serverFetch(`/api/admin/brands`);
}

export async function getAdminBrand(brandId: string): Promise<{ brand: Brand }> {
  return serverFetch(`/api/admin/brands/${brandId}`);
}

export async function getAdminDashboard(): Promise<DashboardData> {
  return serverFetch(`/api/admin/dashboard`);
}

export async function getAdminOrders(status?: string): Promise<{ orders: Order[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return serverFetch(`/api/admin/orders${query}`);
}

export async function getAddresses(): Promise<{ addresses: Address[] }> {
  return serverFetch(`/api/addresses`);
}

export async function getPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[] }> {
  return serverFetch(`/api/payment-methods`);
}

export async function getAdminCampaigns(): Promise<{ campaigns: Campaign[] }> {
  return serverFetch(`/api/admin/campaigns`);
}

export async function getAdminCampaign(campaignId: string): Promise<{ campaign: Campaign }> {
  return serverFetch(`/api/admin/campaigns/${campaignId}`);
}

export type AdminUsersData = {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
};

export async function getAdminUsers(params: {
  q?: string;
  role?: string;
  page?: number;
}): Promise<AdminUsersData> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();
  return serverFetch(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

export async function getAdminRoles(): Promise<{ roles: Role[] }> {
  return serverFetch(`/api/admin/roles`);
}

export async function getAdminRole(roleId: string): Promise<{ role: Role }> {
  return serverFetch(`/api/admin/roles/${roleId}`);
}

export type AdminLogsData<T> = {
  logs: T[];
  total: number;
  page: number;
  pages: number;
};

export async function getAdminLogs(params: {
  type: LogType;
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
}): Promise<AdminLogsData<AuditLogEntry | ErrorLogEntry>> {
  const search = new URLSearchParams();
  search.set("type", params.type);
  if (params.actor) search.set("actor", params.actor);
  if (params.action) search.set("action", params.action);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.page) search.set("page", String(params.page));
  return serverFetch(`/api/admin/logs?${search.toString()}`);
}

export async function getAdminCategoryAttributes(categoryId?: string): Promise<{ attributes: CategoryAttribute[] }> {
  const qs = categoryId ? `?category=${encodeURIComponent(categoryId)}` : "";
  return serverFetch(`/api/admin/category-attributes${qs}`);
}

export async function getAdminCategoryAttribute(attributeId: string): Promise<{ attribute: CategoryAttribute }> {
  return serverFetch(`/api/admin/category-attributes/${attributeId}`);
}

// Public — only the filterable attributes for this category, used by the
// storefront's FilterPanel.
export async function getCategoryAttributes(categoryId: string): Promise<{ attributes: CategoryAttribute[] }> {
  return serverFetch(`/api/categories/${categoryId}/attributes`);
}

export async function getAdminProductVariants(productId: string): Promise<{ variants: ProductVariant[] }> {
  return serverFetch(`/api/admin/products/${productId}/variants`);
}
