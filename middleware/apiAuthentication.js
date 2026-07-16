// JSON counterpart of middleware/authentication.js — the Next.js frontend
// reacts to a 401 by redirecting client-side rather than following a
// server-side res.redirect (which fetch() would just silently follow to
// the login *page's HTML*, not what a JSON caller wants).
module.exports = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Bu işlem için giriş yapmanız gerekiyor.' });
    }
    next();
}
