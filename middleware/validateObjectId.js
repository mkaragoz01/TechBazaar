const mongoose = require('mongoose');

// A malformed ObjectId (broken link, stale bookmark, hand-edited URL) would
// otherwise reach Mongoose's query layer and throw a CastError, which the
// global error handler turns into a generic 500 — for something that's
// really just "this resource doesn't exist," a 404 is the honest answer.
module.exports = function validateObjectId(paramName) {
    return (req, res, next) => {
        if (!mongoose.isValidObjectId(req.params[paramName])) {
            return res.status(404).json({ error: 'Kaynak bulunamadı.' });
        }
        next();
    };
};
