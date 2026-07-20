import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";

// Faz E's e2e scope on purpose: one critical path (browse → cart →
// checkout → order), not broad UI coverage — see PROJECT_ANALYSIS.md.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/node-app";

const TAG = Date.now();
const CUSTOMER_EMAIL = `e2e.customer.${TAG}@example.com`;
const CUSTOMER_PASSWORD = "testpass123";
const CATEGORY_NAME = `E2E Kategori ${TAG}`;
const PRODUCT_NAME = `E2E Kritik Yol Ürünü ${TAG}`;

let mongoClient: MongoClient;
let productId: string;

test.beforeAll(async ({ request }) => {
  const registerRes = await request.post("/api/auth/register", {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    data: {
      name: "E2E Customer",
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      confirmPassword: CUSTOMER_PASSWORD,
    },
  });
  expect(registerRes.ok()).toBeTruthy();

  // Seeded directly rather than through the admin UI — this spec is about
  // the customer journey, not admin product creation (already covered by
  // the backend integration tests and manual admin-form verification).
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db();

  const category = await db.collection("categories").insertOne({ name: CATEGORY_NAME });
  const product = await db.collection("products").insertOne({
    name: PRODUCT_NAME,
    price: 149900,
    description: "E2E kritik yol testi için ürün açıklaması.",
    stock: 5,
    isActive: true,
    userId: new ObjectId(),
    categories: [category.insertedId],
    date: new Date(),
  });
  productId = product.insertedId.toString();
});

test.afterAll(async () => {
  const db = mongoClient.db();
  await db.collection("users").deleteMany({ email: CUSTOMER_EMAIL });
  await db.collection("products").deleteMany({ name: PRODUCT_NAME });
  await db.collection("categories").deleteMany({ name: CATEGORY_NAME });
  await db.collection("orders").deleteMany({ "user.email": CUSTOMER_EMAIL });
  await db.collection("addresses").deleteMany({ fullName: "E2E Test Müşteri" });
  await db.collection("paymentmethods").deleteMany({ cardHolderName: "E2E Test Müşteri" });
  await mongoClient.close();
});

test("customer can browse a product, add it to cart, check out, and see the order", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(CUSTOMER_EMAIL);
  await page.getByLabel("Şifre").fill(CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByText(`Merhaba, E2E Customer`)).toBeVisible();

  await page.goto(`/products/${productId}`);
  await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();
  await page.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(page.getByRole("button", { name: "Sepete Eklendi" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText(PRODUCT_NAME)).toBeVisible();
  await page.getByRole("link", { name: "Siparişi Tamamla" }).click();

  await expect(page.getByRole("heading", { name: "Siparişi Tamamla" })).toBeVisible();
  await page.getByLabel("Adres Başlığı").fill("Ev");
  await page.getByLabel("Ad Soyad").fill("E2E Test Müşteri");
  await page.getByLabel("Telefon").fill("5551234567");
  await page.getByLabel("İl", { exact: true }).fill("İstanbul");
  await page.getByLabel("İlçe").fill("Kadıköy");
  await page.getByLabel("Açık Adres").fill("E2E Test Sokak No:1");
  await page.getByRole("button", { name: "Adresi Kaydet" }).click();
  await expect(page.getByText("Ev — E2E Test Müşteri")).toBeVisible();

  await page.getByLabel("Kart Üzerindeki İsim").fill("E2E Test Müşteri");
  await page.getByPlaceholder("4242 4242 4242 4242").fill("4242424242424242");
  await page.getByLabel("CVV").fill("123");
  await page.getByRole("button", { name: "Kartı Kaydet" }).click();
  await expect(page.getByText("•••• 4242")).toBeVisible();

  await page.getByRole("button", { name: "Siparişi Onayla" }).click();
  await expect(page.getByRole("heading", { name: "Siparişlerim" })).toBeVisible();
  await expect(page.getByText("E2E Test Sokak No:1")).toBeVisible();
  await expect(page.getByText("Visa •••• 4242")).toBeVisible();
});
