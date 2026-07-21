const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, createCategory, createProduct, xhr } = require('./helpers/fixtures');
const CategoryAttribute = require('../models/categoryAttribute');
const ProductVariant = require('../models/productVariant');
const Product = require('../models/product');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

const fakeImage = () => Buffer.from('fake-png-bytes');

describe('category attributes + product variants', () => {
    let app;
    let mongoServer;
    let admin;
    const uploadedImageFiles = [];

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
        admin = await loginAgent(app, { email: 'attr-admin@example.com', isAdmin: true });
    });

    afterAll(async () => {
        for (const filename of uploadedImageFiles) {
            fs.rmSync(path.join(__dirname, '..', 'public', 'img', filename), { force: true });
        }
        await teardownTestApp(mongoServer);
    });

    describe('CategoryAttribute CRUD', () => {
        it('rejects non-admin access', async () => {
            const { agent } = await loginAgent(app, { email: 'plain-attr@example.com', isAdmin: false });
            expect((await agent.get('/api/admin/category-attributes')).status).toBe(403);
        });

        it('creates a select attribute and rejects a duplicate name in the same category', async () => {
            const category = await createCategory('Telefon-Attr1');
            const first = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RAM', valueType: 'select', options: '4GB, 8GB, 16GB'
            });
            expect(first.status).toBe(201);
            expect(first.body.attribute.options).toEqual(['4GB', '8GB', '16GB']);

            const dup = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RAM', valueType: 'select', options: '4GB'
            });
            expect(dup.status).toBe(409);
        });

        it('rejects a select attribute with no options', async () => {
            const category = await createCategory('Telefon-Attr2');
            const res = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'Bos Ozellik', valueType: 'select', options: ''
            });
            expect(res.status).toBe(400);
        });

        it('forces a text attribute to be non-variant-axis and non-filterable regardless of submitted flags', async () => {
            const category = await createCategory('Telefon-Attr3');
            const res = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'Islemci Modeli', valueType: 'text',
                isVariantAxis: true, isFilterable: true
            });
            expect(res.status).toBe(201);
            expect(res.body.attribute.isVariantAxis).toBe(false);
            expect(res.body.attribute.isFilterable).toBe(false);
        });

        it('blocks turning off isVariantAxis while a variant still uses it, and blocks deleting it too', async () => {
            const category = await createCategory('Telefon-Attr4');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'Renk', valueType: 'select', options: 'Kırmızı, Mavi', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;

            const { user: owner } = await createUser({ email: 'attrowner1@example.com' });
            const product = await createProduct({ name: 'Renkli Ürün', categories: [category._id], userId: owner._id, stock: 0 });
            await ProductVariant.create({
                product: product._id,
                attributes: [{ attribute: attributeId, value: 'Kırmızı' }],
                stock: 5
            });

            const editRes = await admin.agent.put(`/api/admin/category-attributes/${attributeId}`).set(xhr).send({
                category: category._id.toString(), name: 'Renk', valueType: 'select', options: 'Kırmızı, Mavi', isVariantAxis: false
            });
            expect(editRes.status).toBe(409);

            const deleteRes = await admin.agent.delete(`/api/admin/category-attributes/${attributeId}`).set(xhr);
            expect(deleteRes.status).toBe(409);
        });

        it('deleting a non-variant attribute pulls it out of any product that used it', async () => {
            const category = await createCategory('Telefon-Attr5');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'Ekran Boyutu', valueType: 'select', options: '6 inç, 6.5 inç'
            });
            const attributeId = attrRes.body.attribute._id;

            const { user: owner } = await createUser({ email: 'attrowner2@example.com' });
            const product = await createProduct({ name: 'Ekranli Ürün', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: product._id }, { attributes: [{ attribute: attributeId, value: '6 inç' }] });

            const deleteRes = await admin.agent.delete(`/api/admin/category-attributes/${attributeId}`).set(xhr);
            expect(deleteRes.status).toBe(200);

            const updated = await Product.findById(product._id).lean();
            expect(updated.attributes).toHaveLength(0);
        });
    });

    describe('Product plain attribute values', () => {
        it('saves a valid plain attribute value and rejects one not in the option list', async () => {
            const category = await createCategory('Telefon-Attr6');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RAM6', valueType: 'select', options: '4GB, 8GB'
            });
            const attributeId = attrRes.body.attribute._id;

            const goodRes = await admin.agent
                .post('/api/admin/products')
                .set(xhr)
                .field('name', 'Ozellikli Urun')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .field('categoryids', category._id.toString())
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: '8GB' }]))
                .attach('imgUrl', fakeImage(), { filename: 'test.png', contentType: 'image/png' });
            expect(goodRes.status).toBe(201);
            uploadedImageFiles.push(goodRes.body.product.imgUrl);
            expect(goodRes.body.product.attributes).toMatchObject([{ attribute: attributeId, value: '8GB' }]);

            const badRes = await admin.agent
                .post('/api/admin/products')
                .set(xhr)
                .field('name', 'Kotu Ozellikli Urun')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .field('categoryids', category._id.toString())
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: '32GB' }]))
                .attach('imgUrl', fakeImage(), { filename: 'test2.png', contentType: 'image/png' });
            expect(badRes.status).toBe(400);
        });
    });

    describe('ProductVariant CRUD', () => {
        it('creates a variant, rejects a duplicate combination, and updates Product.hasVariants', async () => {
            const category = await createCategory('Telefon-Var1');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkV1', valueType: 'select', options: 'Kırmızı, Mavi', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;

            const { user: owner } = await createUser({ email: 'attrowner3@example.com' });
            const product = await createProduct({ name: 'Varyantli Urun', categories: [category._id], userId: owner._id });

            expect((await Product.findById(product._id).lean()).hasVariants).toBe(false);

            const createRes = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Kırmızı' }]))
                .field('stock', '10');
            expect(createRes.status).toBe(201);

            expect((await Product.findById(product._id).lean()).hasVariants).toBe(true);

            const dupRes = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Kırmızı' }]))
                .field('stock', '5');
            expect(dupRes.status).toBe(409);
        });

        it('rejects a variant referencing a value outside the attribute\'s options', async () => {
            const category = await createCategory('Telefon-Var2');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkV2', valueType: 'select', options: 'Kırmızı', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'attrowner4@example.com' });
            const product = await createProduct({ name: 'Varyantli Urun 2', categories: [category._id], userId: owner._id });

            const res = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Yeşil' }]))
                .field('stock', '5');
            expect(res.status).toBe(400);
        });

        it('denormalizes the variant-axis value union onto Product.attributes, and cleans it up on delete', async () => {
            const category = await createCategory('Telefon-Var3');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkV3', valueType: 'select', options: 'Kırmızı, Mavi', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'attrowner5@example.com' });
            const product = await createProduct({ name: 'Varyantli Urun 3', categories: [category._id], userId: owner._id });

            const createRes = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Kırmızı' }]))
                .field('stock', '5');
            const variantId = createRes.body.variant._id;

            let updated = await Product.findById(product._id).lean();
            expect(updated.attributes.map(a => a.value)).toEqual(['Kırmızı']);

            const deleteRes = await admin.agent.delete(`/api/admin/products/${product._id}/variants/${variantId}`).set(xhr);
            expect(deleteRes.status).toBe(200);

            updated = await Product.findById(product._id).lean();
            expect(updated.attributes).toHaveLength(0);
            expect(updated.hasVariants).toBe(false);
        });
    });

    describe('GET /api/products attribute filtering', () => {
        it('filters by a single attribute value', async () => {
            const category = await createCategory('Telefon-Filter1');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RAMFilter1', valueType: 'select', options: '4GB, 8GB'
            });
            const attributeId = attrRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'filterowner1@example.com' });

            const productA = await createProduct({ name: 'Filtre Urun A', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: productA._id }, { attributes: [{ attribute: attributeId, value: '8GB' }] });
            const productB = await createProduct({ name: 'Filtre Urun B', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: productB._id }, { attributes: [{ attribute: attributeId, value: '4GB' }] });

            const res = await request(app).get(`/api/products?attr[${attributeId}]=8GB`);
            expect(res.status).toBe(200);
            const names = res.body.products.map(p => p.name);
            expect(names).toContain('Filtre Urun A');
            expect(names).not.toContain('Filtre Urun B');
        });

        it('ORs multiple values within one attribute and ANDs across two attributes', async () => {
            const category = await createCategory('Telefon-Filter2');
            const ramRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RAMFilter2', valueType: 'select', options: '4GB, 8GB, 16GB'
            });
            const ramId = ramRes.body.attribute._id;
            const colorRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkFilter2', valueType: 'select', options: 'Kırmızı, Mavi'
            });
            const colorId = colorRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'filterowner2@example.com' });

            const productA = await createProduct({ name: 'Filtre Urun C', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: productA._id }, {
                attributes: [{ attribute: ramId, value: '8GB' }, { attribute: colorId, value: 'Kırmızı' }]
            });
            const productB = await createProduct({ name: 'Filtre Urun D', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: productB._id }, {
                attributes: [{ attribute: ramId, value: '16GB' }, { attribute: colorId, value: 'Kırmızı' }]
            });
            const productC = await createProduct({ name: 'Filtre Urun E', categories: [category._id], userId: owner._id });
            await Product.updateOne({ _id: productC._id }, {
                attributes: [{ attribute: ramId, value: '8GB' }, { attribute: colorId, value: 'Mavi' }]
            });

            // RAM in (8GB OR 16GB) AND Renk = Kırmızı — matches A and B, not C.
            const res = await request(app).get(
                `/api/products?attr[${ramId}]=8GB&attr[${ramId}]=16GB&attr[${colorId}]=Kırmızı`
            );
            expect(res.status).toBe(200);
            const names = res.body.products.map(p => p.name);
            expect(names).toContain('Filtre Urun C');
            expect(names).toContain('Filtre Urun D');
            expect(names).not.toContain('Filtre Urun E');
        });
    });

    describe('cart + order with variants', () => {
        it('requires a variantId for a product that has variants, and validates variant stock separately from the product', async () => {
            const category = await createCategory('Telefon-Cart1');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkCart1', valueType: 'select', options: 'Kırmızı, Mavi', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'cartowner1@example.com' });
            const product = await createProduct({ name: 'Sepet Varyant Urun', categories: [category._id], userId: owner._id, stock: 0 });
            const variantRes = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Kırmızı' }]))
                .field('stock', '2');
            const variantId = variantRes.body.variant._id;

            const { agent: shopper } = await loginAgent(app, { email: 'variantshopper1@example.com' });

            const noVariant = await shopper.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            expect(noVariant.status).toBe(400);

            const overStock = await shopper.post('/api/cart').set(xhr).send({
                productId: product._id.toString(), variantId, quantity: 5
            });
            expect(overStock.status).toBe(409);

            const goodAdd = await shopper.post('/api/cart').set(xhr).send({
                productId: product._id.toString(), variantId, quantity: 2
            });
            expect(goodAdd.status).toBe(200);

            const cartRes = await shopper.get('/api/cart');
            expect(cartRes.body.items[0].variantId).toBe(variantId);
            expect(cartRes.body.items[0].variantLabel).toBe('RenkCart1: Kırmızı');
            expect(cartRes.body.items[0].stock).toBe(2);
        });

        it('places an order with a variant, decrements the variant\'s stock (not the product\'s), and snapshots the variant', async () => {
            const Address = require('../models/address');
            const PaymentMethod = require('../models/paymentMethod');

            const category = await createCategory('Telefon-Cart2');
            const attrRes = await admin.agent.post('/api/admin/category-attributes').set(xhr).send({
                category: category._id.toString(), name: 'RenkCart2', valueType: 'select', options: 'Kırmızı', isVariantAxis: true
            });
            const attributeId = attrRes.body.attribute._id;
            const { user: owner } = await createUser({ email: 'cartowner2@example.com' });
            const product = await createProduct({
                name: 'Siparis Varyant Urun', price: 50000, categories: [category._id], userId: owner._id, stock: 999
            });
            const variantRes = await admin.agent
                .post(`/api/admin/products/${product._id}/variants`)
                .set(xhr)
                .field('attributes', JSON.stringify([{ attribute: attributeId, value: 'Kırmızı' }]))
                .field('stock', '3');
            const variantId = variantRes.body.variant._id;

            const { agent: shopper, user: shopperUser } = await loginAgent(app, { email: 'variantshopper2@example.com' });
            await shopper.post('/api/cart').set(xhr).send({ productId: product._id.toString(), variantId, quantity: 2 });

            const address = await Address.create({
                userId: shopperUser._id, title: 'Ev', fullName: 'Test', phone: '5550000000',
                city: 'A', district: 'B', addressLine: 'C', isDefault: true
            });
            const paymentMethod = await PaymentMethod.create({
                userId: shopperUser._id, cardHolderName: 'Test', last4: '4242', brand: 'Visa',
                expiryMonth: 12, expiryYear: 2030, isDefault: true
            });

            const orderRes = await shopper.post('/api/orders').set(xhr).send({
                addressId: address._id.toString(), paymentMethodId: paymentMethod._id.toString()
            });
            expect(orderRes.status).toBe(200);

            const updatedVariant = await ProductVariant.findById(variantId).lean();
            expect(updatedVariant.stock).toBe(1);
            const updatedProduct = await Product.findById(product._id).lean();
            expect(updatedProduct.stock).toBe(999); // untouched — only the variant's stock moves

            const ordersRes = await shopper.get('/api/orders');
            expect(ordersRes.body.orders[0].items[0].variant.label).toBe('RenkCart2: Kırmızı');
        });
    });
});
