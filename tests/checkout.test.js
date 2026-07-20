const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, xhr } = require('./helpers/fixtures');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

describe('checkout (controllers/checkout.js)', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    it('requires auth for addresses and payment methods', async () => {
        expect((await request(app).get('/api/addresses')).status).toBe(401);
        expect((await request(app).get('/api/payment-methods')).status).toBe(401);
    });

    it('creates, lists, and deletes an address', async () => {
        const { agent } = await loginAgent(app, { email: 'addr@example.com' });

        const createRes = await agent.post('/api/addresses').set(xhr).send({
            title: 'Ev',
            fullName: 'Test Kullanıcı',
            phone: '5551234567',
            city: 'Ankara',
            district: 'Çankaya',
            addressLine: 'Test Adres No:1',
            isDefault: true
        });
        expect(createRes.status).toBe(201);

        const listRes = await agent.get('/api/addresses');
        expect(listRes.body.addresses).toHaveLength(1);

        const addressId = createRes.body.address._id;
        const deleteRes = await agent.delete(`/api/addresses/${addressId}`).set(xhr);
        expect(deleteRes.status).toBe(200);

        const listAfterDelete = await agent.get('/api/addresses');
        expect(listAfterDelete.body.addresses).toHaveLength(0);
    });

    it('never persists more than the last 4 digits of a card', async () => {
        const { agent } = await loginAgent(app, { email: 'card@example.com' });

        const res = await agent.post('/api/payment-methods').set(xhr).send({
            cardHolderName: 'Test Kullanıcı',
            cardNumber: '4111 1111 1111 1234',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2030
        });

        expect(res.status).toBe(201);
        expect(res.body.paymentMethod.last4).toBe('1234');
        expect(JSON.stringify(res.body.paymentMethod)).not.toMatch(/4111111111111234/);
    });

    it('rejects an unrealistically short card number', async () => {
        const { agent } = await loginAgent(app, { email: 'shortcard@example.com' });

        const res = await agent.post('/api/payment-methods').set(xhr).send({
            cardHolderName: 'Test Kullanıcı',
            cardNumber: '123',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2030
        });

        expect(res.status).toBe(400);
    });

    it("does not allow deleting another user's address", async () => {
        const { agent: ownerAgent } = await loginAgent(app, { email: 'owner@example.com' });
        const { agent: attackerAgent } = await loginAgent(app, { email: 'attacker@example.com' });

        const createRes = await ownerAgent.post('/api/addresses').set(xhr).send({
            title: 'Ev',
            fullName: 'Sahibi',
            phone: '5550000000',
            city: 'İstanbul',
            district: 'Kadıköy',
            addressLine: 'Sahibinin Adresi'
        });

        const deleteRes = await attackerAgent.delete(`/api/addresses/${createRes.body.address._id}`).set(xhr);
        expect(deleteRes.status).toBe(404);
    });

    // Regression: a malformed id on this route used to reach Mongoose's
    // query cast layer and throw instead of returning a clean 404.
    it('returns 404 (not 500) for a malformed address id', async () => {
        const { agent } = await loginAgent(app, { email: 'malformed@example.com' });
        const res = await agent.delete('/api/addresses/not-a-valid-id').set(xhr);
        expect(res.status).toBe(404);
    });
});
