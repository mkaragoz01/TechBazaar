const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, createCategory, createBrand, createProduct, xhr } = require('./helpers/fixtures');
const Address = require('../models/address');
const PaymentMethod = require('../models/paymentMethod');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

describe('campaigns (controllers/admin.js + controllers/shop.js)', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    describe('admin CRUD', () => {
        it('rejects non-admin access', async () => {
            const { agent } = await loginAgent(app, { email: 'plain@example.com', isAdmin: false });
            const res = await agent.get('/api/admin/campaigns');
            expect(res.status).toBe(403);
        });

        it('creates a campaign with a cartTotal condition and rejects one with no conditions', async () => {
            const { agent } = await loginAgent(app, { email: 'campaignadmin@example.com', isAdmin: true });

            const createRes = await agent.post('/api/admin/campaigns').set(xhr).send({
                name: 'Test Kampanya',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 10000 }] }],
                discountType: 'percentage',
                discountValue: 10,
                appliesTo: 'cartTotal',
                isActive: true
            });
            expect(createRes.status).toBe(201);

            const noConditionRes = await agent.post('/api/admin/campaigns').set(xhr).send({
                name: 'Kosulsuz',
                conditionGroups: [],
                discountType: 'percentage',
                discountValue: 10,
                appliesTo: 'cartTotal'
            });
            expect(noConditionRes.status).toBe(400);
        });

        it('rejects a duplicate campaign code', async () => {
            const { agent } = await loginAgent(app, { email: 'campaignadmin2@example.com', isAdmin: true });

            const body = {
                name: 'Kodlu Kampanya',
                code: 'DUPTEST',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] }],
                discountType: 'fixed',
                discountValue: 1000,
                appliesTo: 'cartTotal'
            };
            const first = await agent.post('/api/admin/campaigns').set(xhr).send(body);
            expect(first.status).toBe(201);

            const second = await agent.post('/api/admin/campaigns').set(xhr).send({ ...body, name: 'Baska Ad' });
            expect(second.status).toBe(409);
        });

        it('returns 404 (not 500) for a malformed campaign id', async () => {
            const { agent } = await loginAgent(app, { email: 'campaignadmin3@example.com', isAdmin: true });
            const res = await agent.get('/api/admin/campaigns/not-a-valid-id');
            expect(res.status).toBe(404);
        });

        // Regression: an end date before the start date used to save
        // successfully, producing a campaign that could never be active at
        // any point in time — no error, just a silently dead campaign.
        it('rejects an end date before the start date', async () => {
            const { agent } = await loginAgent(app, { email: 'campaignadmin4@example.com', isAdmin: true });
            const res = await agent.post('/api/admin/campaigns').set(xhr).send({
                name: 'Ters Tarih Aralığı',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] }],
                discountType: 'percentage',
                discountValue: 10,
                appliesTo: 'cartTotal',
                startDate: '2026-08-19',
                endDate: '2026-07-31'
            });
            expect(res.status).toBe(400);
        });
    });

    describe('storefront: cart discount + code application', () => {
        it('applies an automatic (no-code) campaign to the cart total', async () => {
            const { agent, user } = await loginAgent(app, { email: 'shopper1@example.com' });
            const category = await createCategory('Kategori1');
            const product = await createProduct({ price: 50000, stock: 5, categories: [category._id], userId: user._id });

            const Campaign = require('../models/campaign');
            await Campaign.create({
                name: 'Otomatik %10',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 10000 }] }],
                discountType: 'percentage',
                discountValue: 10,
                appliesTo: 'cartTotal',
                isActive: true
            });

            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            const cartRes = await agent.get('/api/cart');
            expect(cartRes.body.discount).not.toBeNull();
            expect(cartRes.body.discount.amount).toBe(5000);
        });

        it('applies a valid code and rejects an invalid one', async () => {
            const { agent, user } = await loginAgent(app, { email: 'shopper2@example.com' });
            const category = await createCategory('Kategori2');
            const product = await createProduct({ price: 100000, stock: 5, categories: [category._id], userId: user._id });

            const Campaign = require('../models/campaign');
            await Campaign.create({
                name: 'Kodlu Indirim',
                code: 'SHOPPER2CODE',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] }],
                discountType: 'fixed',
                discountValue: 2000,
                appliesTo: 'cartTotal',
                isActive: true
            });

            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });

            const badCode = await agent.post('/api/cart/apply-code').set(xhr).send({ code: 'NOPE' });
            expect(badCode.status).toBe(400);

            const goodCode = await agent.post('/api/cart/apply-code').set(xhr).send({ code: 'shopper2code' });
            expect(goodCode.status).toBe(200);
            expect(goodCode.body.discount.amount).toBe(2000);

            const cartRes = await agent.get('/api/cart');
            expect(cartRes.body.discount.code).toBe('SHOPPER2CODE');

            const removeRes = await agent.post('/api/cart/remove-code').set(xhr);
            expect(removeRes.status).toBe(200);
            const cartAfterRemove = await agent.get('/api/cart');
            // The code-specific discount is gone — whether an unrelated
            // automatic campaign from elsewhere in the suite still applies
            // isn't what this assertion is about.
            expect(cartAfterRemove.body.discount?.code).toBeUndefined();
        });

        it('applies a campaign via a second OR-ed group when the first group does not match', async () => {
            const { agent, user } = await loginAgent(app, { email: 'shopper4@example.com' });
            const category = await createCategory('Kategori4');
            const product = await createProduct({
                name: 'Test Pro Ürün',
                price: 40000,
                stock: 5,
                categories: [category._id],
                userId: user._id
            });

            // This suite shares one in-memory MongoDB across every `it` in this
            // file with no per-test reset, so earlier tests' automatic (no-code)
            // campaigns (e.g. the 10%-off ones above) are still active here too.
            // Using a dominant discountValue — the same pattern the home-banner
            // test below already relies on — ensures pickBestAutomaticCampaign
            // picks *this* campaign regardless of what else lingers in the DB.
            const Campaign = require('../models/campaign');
            await Campaign.create({
                name: 'Grup Kampanyası',
                conditionGroups: [
                    // First group requires an unreachable cart total — never matches.
                    { conditions: [{ type: 'cartTotal', operator: 'gte', value: 999999999 }] },
                    // Second group matches via a productName/contains condition.
                    { conditions: [{ type: 'productName', operator: 'contains', text: 'pro' }] }
                ],
                discountType: 'percentage',
                discountValue: 90,
                appliesTo: 'cartTotal',
                isActive: true
            });

            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            const cartRes = await agent.get('/api/cart');
            expect(cartRes.body.discount).not.toBeNull();
            expect(cartRes.body.discount.amount).toBe(36000);
        });

        it('applies a pre-second-pass campaign that still has a flat `conditions` field instead of conditionGroups', async () => {
            const { agent, user } = await loginAgent(app, { email: 'shopper5@example.com' });
            const category = await createCategory('Kategori5');
            const product = await createProduct({
                price: 60000,
                stock: 5,
                categories: [category._id],
                userId: user._id,
                sku: 'SHOPPER5-ONLY-SKU'
            });

            // Bypasses the Mongoose model (and its current schema) to write the
            // pre-migration document shape directly, the way an untouched old
            // campaign document actually looks in the database. Scoped to this
            // test's own SKU (rather than e.g. cartTotal >= 0) so it can't leak
            // into and skew other tests sharing this file's in-memory DB.
            const Campaign = require('../models/campaign');
            await Campaign.collection.insertOne({
                name: 'Eski Şekilli Kampanya',
                conditions: [{ type: 'product', field: 'sku', operator: 'in', values: ['SHOPPER5-ONLY-SKU'] }],
                discountType: 'percentage',
                discountValue: 95,
                appliesTo: 'cartTotal',
                isActive: true
            });

            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            const cartRes = await agent.get('/api/cart');
            expect(cartRes.body.discount).not.toBeNull();
            expect(cartRes.body.discount.amount).toBe(57000);
        });

        it('snapshots the discount onto the placed order', async () => {
            const { agent, user } = await loginAgent(app, { email: 'shopper3@example.com' });
            const category = await createCategory('Kategori3');
            const brand = await createBrand('Marka3');
            const product = await createProduct({
                price: 80000,
                stock: 5,
                categories: [category._id],
                userId: user._id
            });
            await require('../models/product').updateOne({ _id: product._id }, { brand: brand._id });

            const Campaign = require('../models/campaign');
            await Campaign.create({
                name: 'Marka Indirimi',
                conditionGroups: [
                    { conditions: [{ type: 'product', field: 'brand', operator: 'in', values: [brand._id.toString()] }] }
                ],
                discountType: 'percentage',
                discountValue: 20,
                appliesTo: 'matchingItems',
                isActive: true
            });

            const address = await Address.create({
                userId: user._id, title: 'Ev', fullName: 'Test', phone: '5550000000',
                city: 'A', district: 'B', addressLine: 'C', isDefault: true
            });
            const paymentMethod = await PaymentMethod.create({
                userId: user._id, cardHolderName: 'Test', last4: '4242', brand: 'Visa',
                expiryMonth: 12, expiryYear: 2030, isDefault: true
            });

            await agent.post('/api/cart').set(xhr).send({ productId: product._id.toString() });
            const orderRes = await agent.post('/api/orders').set(xhr).send({
                addressId: address._id.toString(),
                paymentMethodId: paymentMethod._id.toString()
            });
            expect(orderRes.status).toBe(200);

            const ordersRes = await agent.get('/api/orders');
            expect(ordersRes.body.orders[0].discountAmount).toBe(16000);
            expect(ordersRes.body.orders[0].campaignName).toBe('Marka Indirimi');
        });
    });

    describe('home banner (E3)', () => {
        it('exposes the best active automatic campaign for the home banner', async () => {
            const Campaign = require('../models/campaign');
            await Campaign.create({
                name: 'Vitrin Kampanyası',
                description: 'Test banner açıklaması',
                conditionGroups: [{ conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] }],
                discountType: 'percentage',
                discountValue: 99,
                appliesTo: 'cartTotal',
                isActive: true
            });

            const res = await request(app).get('/api/home');
            expect(res.body.campaign).not.toBeNull();
            expect(res.body.campaign.name).toBe('Vitrin Kampanyası');
        });
    });
});
