module.exports = (req, res, next) => {
    // /api/* routes don't run csurf (see app.js), so req.csrfToken doesn't
    // exist there — guard it rather than relying on every route wired
    // through this middleware to remember to skip it.
    res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
    res.locals.isAuthenticated = req.session.isAuthenticated,
    res.locals.isAdmin = req.user ? req.user.isAdmin: false,
    next();
}