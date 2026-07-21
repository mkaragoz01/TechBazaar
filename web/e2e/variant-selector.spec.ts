import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";

// Faz H.4's variant system — verifies VariantSelector renders on the product
// detail page, blocks add-to-cart until a full combination is chosen, and
// that the resolved variant carries through to the cart line's label.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/node-app";

const TAG = Date.now();
const CUSTOMER_EMAIL = `e2e.variant.${TAG}@example.com`;
const CUSTOMER_PASSWORD = "testpass123";
const CATEGORY_NAME = `E2E Varyant Kategori ${TAG}`;
const PRODUCT_NAME = `E2E Varyantlı Ürün ${TAG}`;
const ATTRIBUTE_NAME = `Renk ${TAG}`;

let mongoClient: MongoClient;
let productId: string;

test.beforeAll(async ({ request }) => {
  const registerRes = await request.post("/api/auth/register", {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    data: {
      name: "E2E Variant Customer",
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      confirmPassword: CUSTOMER_PASSWORD,
    },
  });
  expect(registerRes.ok()).toBeTruthy();

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db();

  const category = await db.collection("categories").insertOne({ name: CATEGORY_NAME });

  const attribute = await db.collection("categoryattributes").insertOne({
    category: category.insertedId,
    name: ATTRIBUTE_NAME,
    valueType: "select",
    options: ["Kırmızı", "Mavi"],
    isVariantAxis: true,
    isFilterable: true,
    sortOrder: 0,
  });

  const product = await db.collection("products").insertOne({
    name: PRODUCT_NAME,
    price: 199900,
    description: "E2E varyant testi için ürün açıklaması.",
    stock: 0,
    isActive: true,
    userId: new ObjectId(),
    categories: [category.insertedId],
    date: new Date(),
    hasVariants: true,
    attributes: [
      { attribute: attribute.insertedId, value: "Kırmızı" },
      { attribute: attribute.insertedId, value: "Mavi" },
    ],
  });
  productId = product.insertedId.toString();

  await db.collection("productvariants").insertMany([
    {
      product: product.insertedId,
      attributes: [{ attribute: attribute.insertedId, value: "Kırmızı" }],
      stock: 3,
      isActive: true,
    },
    {
      product: product.insertedId,
      attributes: [{ attribute: attribute.insertedId, value: "Mavi" }],
      stock: 2,
      isActive: true,
    },
  ]);
});

test.afterAll(async () => {
  const db = mongoClient.db();
  await db.collection("users").deleteMany({ email: CUSTOMER_EMAIL });
  await db.collection("products").deleteMany({ name: PRODUCT_NAME });
  await db.collection("categories").deleteMany({ name: CATEGORY_NAME });
  await db.collection("categoryattributes").deleteMany({ name: ATTRIBUTE_NAME });
  await db.collection("productvariants").deleteMany({ product: new ObjectId(productId) });
  await mongoClient.close();
});

test("customer must pick a variant before add-to-cart, and the choice carries into the cart line", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(CUSTOMER_EMAIL);
  await page.getByLabel("Şifre").fill(CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByText("Merhaba, E2E Variant Customer")).toBeVisible();

  await page.goto(`/products/${productId}`);
  await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();

  // No selection yet — add-to-cart must be blocked.
  await expect(page.getByRole("button", { name: "Seçenek Belirleyin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sepete Ekle" })).toHaveCount(0);

  await page.getByRole("button", { name: "Kırmızı" }).click();
  await expect(page.getByRole("button", { name: "Sepete Ekle" })).toBeVisible();
  await page.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(page.getByRole("button", { name: "Sepete Eklendi" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText(PRODUCT_NAME)).toBeVisible();
  await expect(page.getByText(`${ATTRIBUTE_NAME}: Kırmızı`)).toBeVisible();
});
