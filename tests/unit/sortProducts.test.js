const { sortProducts } = require('../../public/js/sorted');

function product(name, price, date) {
    return { name, price, date };
}

describe('sortProducts', () => {
    it('sorts by price ascending', () => {
        const products = [product('a', 300), product('b', 100), product('c', 200)];
        const sorted = sortProducts(products, 'price_asc').map(p => p.name);
        expect(sorted).toEqual(['b', 'c', 'a']);
    });

    it('sorts by price descending', () => {
        const products = [product('a', 300), product('b', 100), product('c', 200)];
        const sorted = sortProducts(products, 'price_desc').map(p => p.name);
        expect(sorted).toEqual(['a', 'c', 'b']);
    });

    it('sorts by date ascending', () => {
        const products = [
            product('newest', 0, '2026-03-01'),
            product('oldest', 0, '2026-01-01'),
            product('middle', 0, '2026-02-01'),
        ];
        const sorted = sortProducts(products, 'date_asc').map(p => p.name);
        expect(sorted).toEqual(['oldest', 'middle', 'newest']);
    });

    it('defaults to date descending for an unknown/missing sort option', () => {
        const products = [
            product('older', 0, '2026-01-01'),
            product('newer', 0, '2026-02-01'),
        ];
        expect(sortProducts(products, undefined).map(p => p.name)).toEqual(['newer', 'older']);
        expect(sortProducts(products, 'not_a_real_option').map(p => p.name)).toEqual(['newer', 'older']);
    });
});
