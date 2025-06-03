function sortProducts(products, sortOption) {
    switch(sortOption) {
        case 'price_asc':
            return products.sort((a, b) => {
                const priceA = parseFloat(a.price.replace(/[^\d.-]/g, ''));
                const priceB = parseFloat(b.price.replace(/[^\d.-]/g, ''));
                return priceA - priceB;
            });
        case 'price_desc':
            return products.sort((a, b) => {
                const priceA = parseFloat(a.price.replace(/[^\d.-]/g, ''));
                const priceB = parseFloat(b.price.replace(/[^\d.-]/g, ''));
                return priceB - priceA;
            });
        case 'date_asc':
            return products.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date_desc':
        default:
            return products.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

module.exports = {
    sortProducts
};