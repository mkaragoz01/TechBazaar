import { serverFetch } from "./server-api";
import type { Category, Product, CartItem, Order } from "./types";

export type { Category, Product, CartItem, Order };

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
  selectedSort: string;
  selectedCategory?: string;
};

export async function getProducts(params: {
  sort?: string;
  category?: string;
}): Promise<ProductsData> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.category) search.set("category", params.category);
  const qs = search.toString();
  return serverFetch<ProductsData>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(productId: string): Promise<{
  product: Product;
  categoryName?: string;
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
