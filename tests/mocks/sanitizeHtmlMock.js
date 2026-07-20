// Real sanitize-html transitively requires htmlparser2, which ships an
// ESM-only build. Plain Node's require() can load that natively (Node 22+),
// which is why the app works outside of tests, but Jest's own CJS module
// system can't — pulling in Babel just to transform one dependency isn't
// worth it here, so tests get a passthrough stub instead. Sanitization
// correctness itself isn't part of what these tests are covering.
module.exports = function sanitizeHtml(html) {
    return html || '';
};
module.exports.defaults = { allowedTags: [], allowedAttributes: {} };
