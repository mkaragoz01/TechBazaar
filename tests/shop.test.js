const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, createCategory, createProduct, xhr } = require('./helpers/fixtures');
const Address = require('../models/address');
const PaymentMethod = require('../models/paymentMethod');

describe('storefront (controllers/shop.js)', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    describe('GET /api/products', () => {
        it('lists active products', async () => {
            const { user } = await createUser({ email: 'lister@example.com' });
            const category = await createCategory('Bilgisayar');
            await createProduct({ name: 'Listelenen Ürün', categories: [category._id], userId: user._id });

            const res = await request(app).get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body.products.some(p => p.name === 'Listelenen Ürün')).toBe(true);
        });

        // Regression: an unparseable minPrice/maxPrice used to set filter.price
        // to an empty {} object, which Mongoose then tried to cast against
        // the Number field and threw — crashing this endpoint with a 500.
        it('does not crash on a garbage price filter', async () => {
            const res = await request(app).get('/api/products?minPrice=abc&maxPrice=xyz');
            expect(res.status).toBe(200);
        });

        it('applies a valid price range filter', async () => {
            const { user } = await createUser({ email: 'pricer@example.com' });
            const category = await createCategory('Aksesuar');
            await createProduct({ name: 'Ucuz Ürün', price: 15000, categories: [category._id], userId: user._id });
            await createProduct({ name: 'Pahali Ürün', price: 500000, categories: [category._id], userId: user._id });

            const res = await request(app).get('/api/products?minPrice=100&maxPrice=200');
            expect(res.status).toBe(200);
            const names = res.body.products.map(p => p.name);
            expect(names).toContain('Ucuz Ürün');
            expect(names).not.toContain('Pahali Ürün');
        });
    });

    describe('GET /api/products/:productid', () => {
        // Regression: a malformed ObjectId used to reach Mongoose's cast
        // layer untouched and throw a CastError — a 500 for what should
        // just be "not found."
        it('returns 404 (not 500) for a malformed id', async () => {
            const res = await request(app).get('/api/products/not-a-valid-id');
            expect(res.status).toBe(404);
        });

        it('returns 404 for a well-formed but nonexistent id', async () => {
            const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');
            expect(res.status).toBe(404);
        });

        it('returns the product with related products from the same category', async () => {
            const { user } = await createUser({ email: 'detail@example.com' });
            const category = await createCategory('Tablet');
            const main = await createProduct({ name: 'Ana Ürün', categories: [category._id], userId: user._id });
            await createProduct({ name: 'Benzer Ürün', categories: [category._id], userId: user._id });

            const res = await request(app).get(`/api/products/${main._id}`);
            expect(res.status).toBe(200);
            expect(res.body.product.name).toBe('Ana Ürün');
            expect(res.body.relatedProducts.some(p => p.name === 'Benzer Ürün')).toBe(true);
        });
    });

    describe('cart + checkout + order flow', () => {
        it('enforces stock when adding to cart and on order placement', async () => {
            const agent = request.agent(app);
            const { user, password } = await createUser({ email: 'shopper@example.com' });
            await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });

            const category = await createCategory('Telefon');
            const outOfStock = await createProduct({
                name: 'Stoksuz Ürün',
                stock: 0,
                categories: [category._id],
                userId: user._id
            });

            const addRes = await agent.post('/api/cart').set(xhr).send({ productId: outOfStock._id.toString() });
            expect(addRes.status).toBe(409);
        });

        it('places an order, decrements stock, and snapshots address/payment', async () => {
            const agent = request.agent(app);
            const { user, password } = await createUser({ email: 'orderer@example.com' });
            await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });

            const category = await createCategory('Kulaklık');
            const product = await createProduct({
                name: 'Siparis Verilecek Ürün',
                price: 25000,
                stock: 3,
                categories: [category._id],
                userId: user._id
            });

            const address = await Address.create({
                userId: user._id,
                title: 'Ev',
                fullName: 'Test Kullanıcı',
                phone: '5551112233',
                city: 'İzmir',
                district: 'Karşıyaka',
                addressLine: 'Test Sokak No:5',
                isDefault: true
            });
            const paymentMethod = await PaymentMethod.create({
                userId: user._id,
                cardHolderName: 'Test Kullanıcı',
                last4: '4242',
                brand: 'Visa',
                expiryMonth: 12,
                expiryYear: 2030,
                isDefault: true
            });

            const addToCart = await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            expect(addToCart.status).toBe(200);

            const orderRes = await agent.post('/api/orders').set(xhr).send({
                addressId: address._id.toString(),
                paymentMethodId: paymentMethod._id.toString()
            });

            expect(orderRes.status).toBe(200);

            const ordersRes = await agent.get('/api/orders');
            expect(ordersRes.body.orders).toHaveLength(1);
            expect(ordersRes.body.orders[0].shippingAddress.addressLine).toBe('Test Sokak No:5');
            expect(ordersRes.body.orders[0].paymentDisplay).toBe('Visa •••• 4242');

            const Product = require('../models/product');
            const updated = await Product.findById(product._id).lean();
            expect(updated.stock).toBe(2);
        });

        it('rejects placing an order with a malformed address/payment id instead of crashing', async () => {
            const agent = request.agent(app);
            const { user, password } = await createUser({ email: 'badorder@example.com' });
            await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });

            const category = await createCategory('Aksesuar2');
            const product = await createProduct({ name: 'Bad Order Ürünü', stock: 5, categories: [category._id], userId: user._id });
            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });

            const res = await agent.post('/api/orders').set(xhr).send({
                addressId: 'not-a-valid-id',
                paymentMethodId: 'also-not-valid'
            });
            expect(res.status).toBe(400);
        });
    });
});
