const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, createCategory, xhr } = require('./helpers/fixtures');
const Order = require('../models/order');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

describe('admin (controllers/admin.js)', () => {
    let app;
    let mongoServer;
    // multer writes to the real public/img/ regardless of which database
    // is in use — the in-memory DB gets torn down for free, but any file a
    // test successfully uploads has to be cleaned up explicitly or it's a
    // permanent orphan on disk.
    const uploadedImageFiles = [];

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
    });

    afterAll(() => {
        for (const filename of uploadedImageFiles) {
            fs.rmSync(path.join(__dirname, '..', 'public', 'img', filename), { force: true });
        }
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    describe('access control', () => {
        it('rejects an anonymous request with 401', async () => {
            const res = await request(app).get('/api/admin/products');
            expect(res.status).toBe(401);
        });

        it('rejects a logged-in non-admin with 403', async () => {
            const { agent } = await loginAgent(app, { email: 'plain@example.com', isAdmin: false });
            const res = await agent.get('/api/admin/products');
            expect(res.status).toBe(403);
        });
    });

    describe('categories', () => {
        it('lets an admin create a category', async () => {
            const { agent } = await loginAgent(app, { email: 'admin1@example.com', isAdmin: true });
            const res = await agent.post('/api/admin/categories').set(xhr).send({ name: 'Yeni Kategori' });
            expect(res.status).toBe(201);
        });
    });

    describe('products', () => {
        // Regression: Product.categories's required:true only ever applied
        // to array elements, never to the array being non-empty — an empty
        // categoryids submission used to save successfully despite the
        // "kategori girmek zorunludur" message implying otherwise.
        it('rejects creating a product with no category selected', async () => {
            const { agent } = await loginAgent(app, { email: 'admin2@example.com', isAdmin: true });

            const res = await agent
                .post('/api/admin/products')
                .set(xhr)
                .field('name', 'Kategorisiz Ürün')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .attach('imgUrl', Buffer.from('fake-png-bytes'), { filename: 'test.png', contentType: 'image/png' });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/kategori/i);
        });

        // Regression: a bad upload used to fall through to the generic
        // "Beklenmedik bir sunucu hatası oluştu" 500 instead of multer's
        // own descriptive message.
        it('rejects an unsupported image type with a clear 400', async () => {
            const { agent } = await loginAgent(app, { email: 'admin3@example.com', isAdmin: true });
            const category = await createCategory('Kategori X');

            const res = await agent
                .post('/api/admin/products')
                .set(xhr)
                .field('name', 'Kotu Gorsel Urun')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .field('categoryids', category._id.toString())
                .attach('imgUrl', Buffer.from('<script>evil</script>'), { filename: 'evil.html', contentType: 'text/html' });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/JPEG|PNG|WEBP|GIF/);
        });

        it('creates a product active by default, and edit can toggle isActive', async () => {
            const { agent } = await loginAgent(app, { email: 'admin4@example.com', isAdmin: true });
            const category = await createCategory('Kategori Y');

            const createRes = await agent
                .post('/api/admin/products')
                .set(xhr)
                .field('name', 'Aktiflik Testi Ürünü')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .field('categoryids', category._id.toString())
                .attach('imgUrl', Buffer.from('fake-png-bytes'), { filename: 'test.png', contentType: 'image/png' });

            expect(createRes.status).toBe(201);
            expect(createRes.body.product.isActive).toBe(true);
            uploadedImageFiles.push(createRes.body.product.imgUrl);

            const productId = createRes.body.product._id;
            const editRes = await agent
                .put(`/api/admin/products/${productId}`)
                .set(xhr)
                .field('name', 'Aktiflik Testi Ürünü')
                .field('price', '100.00')
                .field('description', 'Yeterince uzun aciklama')
                .field('categoryids', category._id.toString())
                .field('isActive', 'false');

            expect(editRes.status).toBe(200);
            expect(editRes.body.product.isActive).toBe(false);
        });

        it('returns 404 (not 500) for a malformed product id', async () => {
            const { agent } = await loginAgent(app, { email: 'admin5@example.com', isAdmin: true });
            const res = await agent.get('/api/admin/products/not-a-valid-id');
            expect(res.status).toBe(404);
        });
    });

    describe('order status', () => {
        it('updates an order status and rejects an invalid status value', async () => {
            const { agent, user } = await loginAgent(app, { email: 'admin6@example.com', isAdmin: true });
            const order = await Order.create({
                user: { userId: user._id, name: user.name, email: user.email },
                shippingAddress: {
                    fullName: 'X', phone: '5550000000', city: 'A', district: 'B', addressLine: 'C'
                },
                paymentDisplay: 'Visa •••• 0000',
                items: [{
                    product: { _id: user._id, name: 'X', price: 100 },
                    quantity: 1
                }]
            });

            const badRes = await agent.put(`/api/admin/orders/${order._id}/status`).set(xhr).send({ status: 'not-a-real-status' });
            expect(badRes.status).toBe(400);

            const goodRes = await agent.put(`/api/admin/orders/${order._id}/status`).set(xhr).send({ status: 'shipped' });
            expect(goodRes.status).toBe(200);

            const updated = await Order.findById(order._id).lean();
            expect(updated.status).toBe('shipped');
        });
    });
});
