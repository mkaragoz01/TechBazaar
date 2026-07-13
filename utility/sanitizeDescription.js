const sanitizeHtml = require('sanitize-html');

module.exports = function sanitizeDescription(html) {
    return sanitizeHtml(html || '', {
        allowedTags: sanitizeHtml.defaults.allowedTags,
        allowedAttributes: sanitizeHtml.defaults.allowedAttributes
    });
};
