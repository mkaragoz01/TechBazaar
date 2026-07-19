const rateLimit = require('express-rate-limit');

// Each auth action gets its own budget — a normal user mistyping a password
// a few times, then requesting a reset, then registering a second account
// is a plausible, non-malicious sequence, and previously exhausted a single
// shared 10-req/15min counter across all four routes, locking the user out
// of everything for 15 minutes.
function createAuthLimiter() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.',
    });
}

module.exports = {
    loginLimiter: createAuthLimiter(),
    registerLimiter: createAuthLimiter(),
    resetPasswordLimiter: createAuthLimiter(),
    newPasswordLimiter: createAuthLimiter(),
};
