import { serverFetch } from "./server-api";
import type { Category, Brand, Product, CartItem, Order, Address, PaymentMethod } from "./types";

export type { Category, Brand, Product, CartItem, Order, Address, PaymentMethod };

export type HomeData = {
  products: Product[];
  categories: Category[];
  selectedSort: string;
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
};

export async function getProducts(params: {
  sort?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
}): Promise<ProductsData> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.category) search.set("category", params.category);
  if (params.brand) search.set("brand", params.brand);
  if (params.minPrice) search.set("minPrice", params.minPrice);
  if (params.maxPrice) search.set("maxPrice", params.maxPrice);
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return serverFetch<ProductsData>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(productId: string): Promise<{
  product: Product;
  categoryName?: string;
  brandName?: string;
  relatedProducts: Product[];
}> {
  return serverFetch(`/api/products/${productId}`);
}

export async function getCart(): Promise<{ items: CartItem[] }> {
  return serverFetch(`/api/cart`);
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

export async function getAdminDashboard(): Promise<{ orders: Order[] }> {
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
