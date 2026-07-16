// Replaces csurf for the /api/* routes now that the frontend is a fetch-based
// SPA rather than server-rendered forms with an embedded _csrf token.
//
// A plain HTML form (the classic CSRF vector) can only ever send
// application/x-www-form-urlencoded, multipart/form-data, or text/plain, and
// can never set a custom header. Cross-origin fetch/XHR *can* set one, but
// doing so forces a CORS preflight — which fails here since we don't send
// Access-Control-Allow-Origin for foreign origins. Requiring this header on
// every mutating request therefore blocks both vectors without needing a
// token to generate, store, and compare.
module.exports = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
        return res.status(403).json({ error: 'İstek reddedildi.' });
    }

    next();
}
