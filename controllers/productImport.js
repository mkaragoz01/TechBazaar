const XLSX = require('xlsx');
const Product = require('../models/product');
const Category = require('../models/category');
const Brand = require('../models/brand');
const sanitizeDescription = require('../utility/sanitizeDescription');
const { parsePriceToKurus } = require('../utility/formatPrice');

const HEADERS = [
    'SKU', 'Ürün Adı', 'Fiyat (TL)', 'Stok', 'Kategori', 'Marka',
    'Açıklama', 'Yeni Ürün', 'Öne Çıkan', 'Aktif'
];

function stripHtml(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseBoolean(value, defaultValue) {
    if (value === undefined || value === null || value === '') return defaultValue;
    const normalized = String(value).trim().toLocaleLowerCase('tr');
    if (['true', '1', 'evet', 'yes', 'doğru'].includes(normalized)) return true;
    if (['false', '0', 'hayır', 'no', 'yanlış'].includes(normalized)) return false;
    return defaultValue;
}

async function loadLookups() {
    const [categories, brands] = await Promise.all([Category.find().lean(), Brand.find().lean()]);
    const categoriesByName = new Map(categories.map(c => [c.name.toLocaleLowerCase('tr'), c]));
    const brandsByName = new Map(brands.map(b => [b.name.toLocaleLowerCase('tr'), b]));
    return { categoriesByName, brandsByName };
}

function validateRow(row, categoriesByName, brandsByName) {
    const errors = [];

    const sku = String(row['SKU'] ?? '').trim();
    if (!sku) errors.push('SKU zorunludur.');

    const name = String(row['Ürün Adı'] ?? '').trim();
    if (name.length < 5 || name.length > 255) {
        errors.push('Ürün adı 5-255 karakter olmalıdır.');
    }

    const priceKurus = parsePriceToKurus(row['Fiyat (TL)']);
    if (Number.isNaN(priceKurus) || priceKurus < 0) {
        errors.push('Geçerli bir fiyat giriniz.');
    }

    const stockRaw = row['Stok'];
    const stock = stockRaw === undefined || stockRaw === '' ? 0 : Number(stockRaw);
    if (Number.isNaN(stock) || stock < 0) {
        errors.push('Geçerli bir stok değeri giriniz.');
    }

    const categoryNames = String(row['Kategori'] ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const categoryIds = [];
    if (categoryNames.length === 0) {
        errors.push('En az bir kategori giriniz.');
    } else {
        for (const categoryName of categoryNames) {
            const match = categoriesByName.get(categoryName.toLocaleLowerCase('tr'));
            if (!match) {
                errors.push(`Kategori bulunamadı: "${categoryName}"`);
            } else {
                categoryIds.push(match._id);
            }
        }
    }

    let brandId;
    const brandName = String(row['Marka'] ?? '').trim();
    if (brandName) {
        const match = brandsByName.get(brandName.toLocaleLowerCase('tr'));
        if (!match) {
            errors.push(`Marka bulunamadı: "${brandName}"`);
        } else {
            brandId = match._id;
        }
    }

    const description = String(row['Açıklama'] ?? '').trim();
    if (description && description.length < 3) {
        errors.push('Açıklama en az 3 karakter olmalıdır (veya tamamen boş bırakılmalıdır).');
    }

    return {
        sku,
        name,
        priceKurus,
        stock,
        categoryIds,
        brandId,
        description: description || undefined,
        isNewArrival: parseBoolean(row['Yeni Ürün'], false),
        isFeatured: parseBoolean(row['Öne Çıkan'], false),
        isActive: parseBoolean(row['Aktif'], true),
        errors
    };
}

async function parseWorkbook(buffer) {
    let workbook;
    try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
        const err = new Error('Dosya okunamadı — geçerli bir Excel (.xlsx) dosyası olduğundan emin olun.');
        err.status = 400;
        throw err;
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
        const err = new Error('Excel dosyasında okunacak bir sayfa bulunamadı.');
        err.status = 400;
        throw err;
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const { categoriesByName, brandsByName } = await loadLookups();

    const existingProducts = await Product.find({ sku: { $nin: [null, ''] } }).select('sku').lean();
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    const seenSkus = new Set();
    return rawRows.map((row, index) => {
        const rowNumber = index + 2; // row 1 is the header
        const parsed = validateRow(row, categoriesByName, brandsByName);

        if (parsed.sku) {
            if (seenSkus.has(parsed.sku)) {
                parsed.errors.push('Bu SKU dosya içinde birden fazla kez geçiyor.');
            }
            seenSkus.add(parsed.sku);
        }

        const action = parsed.errors.length > 0
            ? 'error'
            : (existingSkus.has(parsed.sku) ? 'update' : 'create');

        return { rowNumber, ...parsed, action };
    });
}

exports.handleUploadError = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({ error: err.message || 'Dosya yüklenemedi.' });
    }
    next();
};

exports.postValidateImport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Bir Excel dosyası yükleyiniz.' });
        }

        const results = await parseWorkbook(req.file.buffer);

        res.json({
            summary: {
                total: results.length,
                toCreate: results.filter(r => r.action === 'create').length,
                toUpdate: results.filter(r => r.action === 'update').length,
                errors: results.filter(r => r.action === 'error').length
            },
            rows: results.map(r => ({
                rowNumber: r.rowNumber,
                sku: r.sku,
                name: r.name,
                action: r.action,
                errors: r.errors
            }))
        });
    } catch (err) {
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

// Nothing is written until this endpoint is called explicitly by the admin
// clicking "Onayla ve İçe Aktar" — re-validates the same file rather than
// trusting client-reported results, and a bad row is skipped/reported
// rather than aborting the rows that did pass validation.
exports.postConfirmImport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Bir Excel dosyası yükleyiniz.' });
        }

        const results = await parseWorkbook(req.file.buffer);

        let created = 0;
        let updated = 0;
        const failedRows = [];

        for (const row of results) {
            if (row.action === 'error') {
                failedRows.push({ rowNumber: row.rowNumber, sku: row.sku, errors: row.errors });
                continue;
            }

            const update = {
                name: row.name,
                price: row.priceKurus,
                stock: row.stock,
                categories: row.categoryIds,
                isActive: row.isActive,
                isNewArrival: row.isNewArrival,
                isFeatured: row.isFeatured
            };
            if (row.brandId) update.brand = row.brandId;
            if (row.description) update.description = sanitizeDescription(row.description);

            try {
                if (row.action === 'update') {
                    await Product.updateOne({ sku: row.sku }, { $set: update }, { runValidators: true });
                    updated++;
                } else {
                    await Product.create({ ...update, sku: row.sku, userId: req.user._id });
                    created++;
                }
            } catch (err) {
                failedRows.push({
                    rowNumber: row.rowNumber,
                    sku: row.sku,
                    errors: [err.name === 'ValidationError'
                        ? Object.values(err.errors).map(e => e.message).join(' ')
                        : (err.code === 11000 ? 'Bu SKU zaten kullanılıyor.' : 'Kaydedilemedi.')]
                });
            }
        }

        res.json({
            summary: { created, updated, failed: failedRows.length, total: results.length },
            failedRows
        });
    } catch (err) {
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

exports.getImportTemplate = (req, res, next) => {
    try {
        const exampleRow = {
            'SKU': 'ORNEK-001',
            'Ürün Adı': 'Örnek Ürün Adı',
            'Fiyat (TL)': 1499.9,
            'Stok': 10,
            'Kategori': 'Telefon',
            'Marka': '',
            'Açıklama': 'Ürün açıklaması buraya yazılır.',
            'Yeni Ürün': 'FALSE',
            'Öne Çıkan': 'FALSE',
            'Aktif': 'TRUE'
        };
        const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Şablon');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="urun-sablonu.xlsx"');
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

exports.getExportProducts = async (req, res, next) => {
    try {
        const products = await Product.find()
            .populate('categories')
            .populate('brand')
            .lean();

        const rows = products.map(p => ({
            'SKU': p.sku || '',
            'Ürün Adı': p.name,
            'Fiyat (TL)': Math.round(p.price || 0) / 100,
            'Stok': p.stock ?? 0,
            'Kategori': (p.categories || []).map(c => c.name).join(', '),
            'Marka': p.brand ? p.brand.name : '',
            'Açıklama': stripHtml(p.description),
            'Yeni Ürün': p.isNewArrival ? 'TRUE' : 'FALSE',
            'Öne Çıkan': p.isFeatured ? 'TRUE' : 'FALSE',
            'Aktif': p.isActive ? 'TRUE' : 'FALSE'
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="urunler.xlsx"');
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};
