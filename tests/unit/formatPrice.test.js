const { parsePriceToKurus, formatPriceNumber, formatPrice } = require('../../utility/formatPrice');

describe('parsePriceToKurus', () => {
    it('converts a plain decimal TL amount to kuruş', () => {
        expect(parsePriceToKurus('1499.90')).toBe(149990);
    });

    it('converts a Turkish-formatted amount (dot thousands, comma decimal)', () => {
        expect(parsePriceToKurus('1.499,90')).toBe(149990);
    });

    it('converts a plain number input', () => {
        expect(parsePriceToKurus(199.99)).toBe(19999);
    });

    it('returns NaN for empty/missing input', () => {
        expect(Number.isNaN(parsePriceToKurus(''))).toBe(true);
        expect(Number.isNaN(parsePriceToKurus(null))).toBe(true);
        expect(Number.isNaN(parsePriceToKurus(undefined))).toBe(true);
    });

    it('returns NaN for garbage input instead of throwing', () => {
        expect(Number.isNaN(parsePriceToKurus('abc'))).toBe(true);
    });
});

describe('formatPriceNumber / formatPrice', () => {
    it('formats kuruş back to a Turkish-locale TL string', () => {
        expect(formatPriceNumber(149990)).toBe('1.499,90');
    });

    it('treats a missing/invalid value as zero rather than throwing', () => {
        expect(formatPriceNumber(undefined)).toBe('0,00');
    });

    it('formatPrice appends the TL suffix', () => {
        expect(formatPrice(149990)).toBe('1.499,90 TL');
    });
});
