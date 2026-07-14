// Fiyatlar veritabanında kuruş bazlı tam sayı (integer) olarak saklanır.
// Örn: 149900 kuruş === 1.499,00 TL. Bu, TL ondalıklarıyla toplama/çarpma
// yaparken oluşabilecek JS floating-point yuvarlama hatalarını engeller.

function parsePriceToKurus(input) {
    if (input === null || input === undefined || input === '') {
        return NaN;
    }

    const normalized = String(input)
        .trim()
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    const tl = parseFloat(normalized);
    if (Number.isNaN(tl)) {
        return NaN;
    }

    return Math.round(tl * 100);
}

function formatPriceNumber(kurus) {
    const tl = (Number(kurus) || 0) / 100;
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tl);
}

function formatPrice(kurus) {
    return formatPriceNumber(kurus) + ' TL';
}

module.exports = { parsePriceToKurus, formatPrice, formatPriceNumber };
