const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { xhr } = require('./helpers/fixtures');

describe('auth (routes/account.js)', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    describe('POST /api/auth/register', () => {
        it('creates a new account', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set(xhr)
                .send({ name: 'Ali', email: 'ali@example.com', password: 'sifre123', confirmPassword: 'sifre123' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ ok: true });
        });

        it('rejects a duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set(xhr)
                .send({ name: 'Ali Ikinci', email: 'ali@example.com', password: 'sifre123', confirmPassword: 'sifre123' });

            expect(res.status).toBe(409);
        });

        it('rejects a password shorter than 6 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set(xhr)
                .send({ name: 'Kisa Sifre', email: 'kisa@example.com', password: '123', confirmPassword: '123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/en az 6 karakter/);
        });

        it('rejects a mutating request without the X-Requested-With header', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'No Header', email: 'noheader@example.com', password: 'sifre123', confirmPassword: 'sifre123' });

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/auth/login', () => {
        it('logs in with correct credentials and sets a session cookie', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set(xhr)
                .send({ email: 'ali@example.com', password: 'sifre123' });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('ali@example.com');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('rejects a wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set(xhr)
                .send({ email: 'ali@example.com', password: 'yanlisSifre' });

            expect(res.status).toBe(401);
        });

        it('rejects an unknown email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set(xhr)
                .send({ email: 'yok@example.com', password: 'sifre123' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('returns 401 when not logged in', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('returns the current user for a logged-in session', async () => {
            const agent = request.agent(app);
            await agent.post('/api/auth/login').set(xhr).send({ email: 'ali@example.com', password: 'sifre123' });

            const res = await agent.get('/api/auth/me');
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('ali@example.com');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('ends the session so /api/auth/me becomes 401 again', async () => {
            const agent = request.agent(app);
            await agent.post('/api/auth/login').set(xhr).send({ email: 'ali@example.com', password: 'sifre123' });
            await agent.post('/api/auth/logout').set(xhr);

            const res = await agent.get('/api/auth/me');
            expect(res.status).toBe(401);
        });
    });
});
