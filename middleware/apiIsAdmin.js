module.exports = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Bu işlem için giriş yapmanız gerekiyor.' });
    }
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
    }
    next();
}
