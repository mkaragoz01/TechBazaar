import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/config";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/filter/newest", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/filter/favorites", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/filter/premium", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/hakkimizda", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/iletisim", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/kargo-takibi", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/legal/kvkk", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/mesafeli-satis", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/iptal-iade", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/kullanim-sartlari", priority: 0.2, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const { products, categories } = await getProducts({});

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category._id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product._id}`,
    lastModified: product.date ? new Date(product.date) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
