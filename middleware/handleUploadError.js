// Multer's fileFilter/limits errors (wrong mime type, file too large) call
// next(err) — without this, they fall through to the global error handler
// and surface as a generic 500 instead of the specific, actionable message
// multer already produced (e.g. "Sadece JPEG, PNG, WEBP veya GIF...").
module.exports = function handleUploadError(err, req, res, next) {
    if (err) {
        return res.status(400).json({ error: err.message || 'Dosya yüklenemedi.' });
    }
    next();
};
