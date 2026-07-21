const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, xhr } = require('./helpers/fixtures');
const Role = require('../models/role');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

// Idempotent — this suite shares one in-memory DB across every `it`, so a
// later test's seedRoles() call must not collide with an earlier one's.
async function seedRoles() {
    await Role.updateOne({ name: 'admin' }, { $set: { isAdminRole: true, protected: true } }, { upsert: true });
    await Role.updateOne({ name: 'customer' }, { $set: { isAdminRole: false, protected: true } }, { upsert: true });
}

describe('user & role management (controllers/admin.js)', () => {
    let app;
    let mongoServer;
    // The login route is rate-limited (10 req/15min, see
    // middleware/authLimiter.js) — shared across most tests in this file
    // instead of logging in fresh per test, so the suite doesn't trip it.
    let sharedAdmin;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
        await seedRoles();
        sharedAdmin = await loginAgent(app, { email: 'shared-admin@example.com', isAdmin: true });
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    describe('access control', () => {
        it('rejects non-admin access to the user and role lists', async () => {
            const { agent } = await loginAgent(app, { email: 'plainuser1@example.com', isAdmin: false });
            expect((await agent.get('/api/admin/users')).status).toBe(403);
            expect((await agent.get('/api/admin/roles')).status).toBe(403);
        });
    });

    describe('GET /api/admin/users', () => {
        it('lists users and supports name/email search', async () => {
            await createUser({ email: 'aylin@example.com', name: 'Aylin Yılmaz' });
            await createUser({ email: 'baris@example.com', name: 'Barış Demir' });

            const all = await sharedAdmin.agent.get('/api/admin/users');
            expect(all.status).toBe(200);
            expect(all.body.total).toBeGreaterThanOrEqual(3);

            const searched = await sharedAdmin.agent.get('/api/admin/users?q=aylin');
            expect(searched.status).toBe(200);
            expect(searched.body.users.some(u => u.email === 'aylin@example.com')).toBe(true);
            expect(searched.body.users.some(u => u.email === 'baris@example.com')).toBe(false);
        });

        it('treats regex special characters in the search term literally', async () => {
            const res = await sharedAdmin.agent.get('/api/admin/users?q=' + encodeURIComponent('a+b('));
            expect(res.status).toBe(200);
        });
    });

    describe('PUT /api/admin/users/:userid/role', () => {
        it('blocks an admin from changing their own role', async () => {
            const { agent, user } = await loginAgent(app, { email: 'selfadmin@example.com', isAdmin: true });
            const res = await agent
                .put(`/api/admin/users/${user._id}/role`)
                .set(xhr)
                .send({ role: 'customer' });
            expect(res.status).toBe(400);
        });

        it('allows an admin to change another user\'s role', async () => {
            const { user: target } = await createUser({ email: 'target1@example.com', isAdmin: false });

            const res = await sharedAdmin.agent
                .put(`/api/admin/users/${target._id}/role`)
                .set(xhr)
                .send({ role: 'admin' });
            expect(res.status).toBe(200);
            expect(res.body.user.isAdmin).toBe(true);
            expect(res.body.user.role).toBe('admin');
        });

        it('rejects an unknown role name', async () => {
            const { user: target } = await createUser({ email: 'target2@example.com', isAdmin: false });

            const res = await sharedAdmin.agent
                .put(`/api/admin/users/${target._id}/role`)
                .set(xhr)
                .send({ role: 'does-not-exist' });
            expect(res.status).toBe(400);
        });

        // Regression for the session-staleness fix (Faz H.2): before it,
        // apiIsAdmin read req.session.isAdmin, a snapshot taken only at
        // login — so a user demoted mid-session kept admin access on their
        // existing session until logging out and back in.
        it('revokes admin access immediately on the demoted user\'s own existing session, no re-login needed', async () => {
            const { agent: targetSession, user: target } = await loginAgent(app, { email: 'target3@example.com', isAdmin: true });

            // The soon-to-be-demoted user's OWN session can still reach an
            // admin endpoint before the change.
            expect((await targetSession.get('/api/admin/products')).status).toBe(200);

            const demote = await sharedAdmin.agent
                .put(`/api/admin/users/${target._id}/role`)
                .set(xhr)
                .send({ role: 'customer' });
            expect(demote.status).toBe(200);

            // Same session, no re-login — must be locked out immediately.
            expect((await targetSession.get('/api/admin/products')).status).toBe(403);
        });
    });

    describe('GET /api/admin/users/export', () => {
        it('returns an xlsx file', async () => {
            const res = await sharedAdmin.agent.get('/api/admin/users/export');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe(
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
        });
    });

    describe('role CRUD', () => {
        it('creates a role and rejects a duplicate name', async () => {
            const first = await sharedAdmin.agent.post('/api/admin/roles').set(xhr).send({ name: 'vip', isAdminRole: false });
            expect(first.status).toBe(201);

            const dup = await sharedAdmin.agent.post('/api/admin/roles').set(xhr).send({ name: 'vip', isAdminRole: false });
            expect(dup.status).toBe(409);
        });

        it('blocks editing or deleting a protected role', async () => {
            const adminRole = await Role.findOne({ name: 'admin' });

            const editRes = await sharedAdmin.agent
                .put(`/api/admin/roles/${adminRole._id}`)
                .set(xhr)
                .send({ name: 'admin', isAdminRole: true });
            expect(editRes.status).toBe(409);

            const deleteRes = await sharedAdmin.agent.delete(`/api/admin/roles/${adminRole._id}`).set(xhr);
            expect(deleteRes.status).toBe(409);
        });

        it('blocks deleting a role that still has users assigned', async () => {
            const created = await sharedAdmin.agent.post('/api/admin/roles').set(xhr).send({ name: 'beta-tester', isAdminRole: false });
            const roleId = created.body.role._id;

            const { user: target } = await createUser({ email: 'betauser@example.com', isAdmin: false });
            await sharedAdmin.agent.put(`/api/admin/users/${target._id}/role`).set(xhr).send({ role: 'beta-tester' });

            const deleteRes = await sharedAdmin.agent.delete(`/api/admin/roles/${roleId}`).set(xhr);
            expect(deleteRes.status).toBe(409);
        });
    });
});
