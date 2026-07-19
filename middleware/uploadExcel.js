const multer = require('multer');

const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece Excel (.xlsx/.xls) dosyası yükleyebilirsiniz.'));
    }
};

// Parsed entirely in memory (no disk write) — the file only ever exists
// long enough to be read into a workbook and then discarded.
module.exports = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
