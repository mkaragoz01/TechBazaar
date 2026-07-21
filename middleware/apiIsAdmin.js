// Reads admin status off req.user (refreshed from the DB on every request by
// app.js) rather than a session snapshot — a snapshot taken once at login
// would keep acting on a user's OLD role after an admin changes it, until
// that user logs out and back in.
module.exports = (req, res, next) => {
    if (!req.session.isAuthenticated || !req.user) {
        return res.status(401).json({ error: 'Bu işlem için giriş yapmanız gerekiyor.' });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
    }
    next();
}
