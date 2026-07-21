const request = require('supertest');
const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { createUser, xhr } = require('./helpers/fixtures');
const Role = require('../models/role');
const AuditLog = require('../models/auditLog');
const ErrorLog = require('../models/errorLog');

async function loginAgent(app, overrides) {
    const agent = request.agent(app);
    const { user, password } = await createUser(overrides);
    await agent.post('/api/auth/login').set(xhr).send({ email: user.email, password });
    return { agent, user };
}

describe('admin logs (controllers/logs.js)', () => {
    let app;
    let mongoServer;
    let admin;

    beforeAll(async () => {
        ({ app, mongoServer } = await setupTestApp());
        await Role.updateOne({ name: 'admin' }, { $set: { isAdminRole: true, protected: true } }, { upsert: true });
        await Role.updateOne({ name: 'customer' }, { $set: { isAdminRole: false, protected: true } }, { upsert: true });
        admin = await loginAgent(app, { email: 'logs-admin@example.com', isAdmin: true });
    });

    afterAll(async () => {
        await teardownTestApp(mongoServer);
    });

    it('rejects non-admin access', async () => {
        const { agent } = await loginAgent(app, { email: 'logs-plain@example.com', isAdmin: false });
        expect((await agent.get('/api/admin/logs')).status).toBe(403);
    });

    it('records an audit log entry when a user role is changed', async () => {
        const { user: target } = await createUser({ email: 'logs-target@example.com', isAdmin: false });
        await admin.agent.put(`/api/admin/users/${target._id}/role`).set(xhr).send({ role: 'admin' });

        const res = await admin.agent.get('/api/admin/logs?type=audit');
        expect(res.status).toBe(200);
        const entry = res.body.logs.find(l => String(l.targetId) === String(target._id));
        expect(entry).toBeDefined();
        expect(entry.action).toBe('user.role.update');
        expect(entry.after.role).toBe('admin');
    });

    it('paginates and filters audit logs by action', async () => {
        await AuditLog.create([
            { actor: { id: admin.user._id, name: 'A', email: 'a@x.com' }, action: 'test.one' },
            { actor: { id: admin.user._id, name: 'A', email: 'a@x.com' }, action: 'test.two' },
            { actor: { id: admin.user._id, name: 'A', email: 'a@x.com' }, action: 'test.two' }
        ]);

        const filtered = await admin.agent.get('/api/admin/logs?type=audit&action=test.two&limit=1&page=1');
        expect(filtered.status).toBe(200);
        expect(filtered.body.logs).toHaveLength(1);
        expect(filtered.body.logs[0].action).toBe('test.two');
        expect(filtered.body.total).toBe(2);
        expect(filtered.body.pages).toBe(2);
    });

    it('lists error logs separately from audit logs via ?type=error', async () => {
        await ErrorLog.create({ message: 'Test hatası', stack: 'Error: Test hatası\n at x', method: 'GET', path: '/api/test', statusCode: 500 });

        const res = await admin.agent.get('/api/admin/logs?type=error');
        expect(res.status).toBe(200);
        expect(res.body.logs.some(l => l.message === 'Test hatası')).toBe(true);
        expect(res.body.logs.some(l => l.action === 'user.role.update')).toBe(false);
    });

    it('exports both log types as xlsx', async () => {
        const auditExport = await admin.agent.get('/api/admin/logs/export?type=audit');
        expect(auditExport.status).toBe(200);
        expect(auditExport.headers['content-type']).toBe(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        const errorExport = await admin.agent.get('/api/admin/logs/export?type=error');
        expect(errorExport.status).toBe(200);
        expect(errorExport.headers['content-type']).toBe(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
    });
});
