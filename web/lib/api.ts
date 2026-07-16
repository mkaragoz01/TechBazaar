import { EXPRESS_ORIGIN } from "./config";

export type Category = {
  _id: string;
  name: string;
  description?: string;
};

export type Product = {
  _id: string;
  name: string;
  price: number; // kuruş
  description?: string;
  imgUrl?: string;
  stock?: number;
  isActive?: boolean;
  categories: string[];
  date?: string;
};

export type HomeData = {
  products: Product[];
  categories: Category[];
  selectedSort: string;
};

export async function getHomeData(sort?: string): Promise<HomeData> {
  const url = new URL("/api/home", EXPRESS_ORIGIN);
  if (sort) url.searchParams.set("sort", sort);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`/api/home failed: ${res.status}`);
  }
  return res.json();
}

export function productImageUrl(imgUrl: string | undefined): string {
  return `${EXPRESS_ORIGIN}/img/${imgUrl ?? ""}`;
}
