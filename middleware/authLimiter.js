const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.',
});
