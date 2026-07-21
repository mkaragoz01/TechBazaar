const XLSX = require('xlsx');
const AuditLog = require('../models/auditLog');
const ErrorLog = require('../models/errorLog');

function paginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return { page, limit };
}

function dateRangeFilter(query) {
    const range = {};
    if (query.from) range.$gte = new Date(query.from);
    if (query.to) range.$lte = new Date(query.to);
    return Object.keys(range).length > 0 ? range : undefined;
}

// The two log types have different fields to filter on (actor/action vs.
// path/statusCode) — kept as two small builders rather than one merged
// filter function that has to know about both shapes.
function buildAuditFilter(query) {
    const filter = {};
    if (query.actor) filter['actor.id'] = query.actor;
    if (query.action) filter.action = query.action;
    const createdAt = dateRangeFilter(query);
    if (createdAt) filter.createdAt = createdAt;
    return filter;
}

function buildErrorFilter(query) {
    const filter = {};
    const createdAt = dateRangeFilter(query);
    if (createdAt) filter.createdAt = createdAt;
    return filter;
}

exports.getLogs = async (req, res, next) => {
    try {
        const isError = req.query.type === 'error';
        const Model = isError ? ErrorLog : AuditLog;
        const filter = isError ? buildErrorFilter(req.query) : buildAuditFilter(req.query);
        const { page, limit } = paginationParams(req.query);

        const [logs, total] = await Promise.all([
            Model.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Model.countDocuments(filter)
        ]);

        res.json({ logs, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (err) {
        next(err);
    }
}

exports.getLogsExport = async (req, res, next) => {
    try {
        const isError = req.query.type === 'error';
        const Model = isError ? ErrorLog : AuditLog;
        const filter = isError ? buildErrorFilter(req.query) : buildAuditFilter(req.query);
        const logs = await Model.find(filter).sort({ createdAt: -1 }).lean();

        const headers = isError
            ? ['Tarih', 'Metod', 'Yol', 'Durum Kodu', 'Mesaj']
            : ['Tarih', 'Yapan', 'İşlem', 'Hedef Türü', 'Hedef ID'];

        const rows = logs.map(log => isError
            ? {
                'Tarih': log.createdAt ? new Date(log.createdAt).toLocaleString('tr-TR') : '',
                'Metod': log.method || '',
                'Yol': log.path || '',
                'Durum Kodu': log.statusCode ?? '',
                'Mesaj': log.message || ''
            }
            : {
                'Tarih': log.createdAt ? new Date(log.createdAt).toLocaleString('tr-TR') : '',
                'Yapan': log.actor ? `${log.actor.name} (${log.actor.email})` : '',
                'İşlem': log.action,
                'Hedef Türü': log.targetType || '',
                'Hedef ID': log.targetId ? String(log.targetId) : ''
            });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, isError ? 'Hata Logları' : 'Audit Log');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${isError ? 'hata-loglari' : 'audit-log'}.xlsx"`);
        res.send(buffer);
    } catch (err) {
        next(err);
    }
}
