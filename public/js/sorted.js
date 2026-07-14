function sortProducts(products, sortOption) {
    switch(sortOption) {
        case 'price_asc':
            return products.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return products.sort((a, b) => b.price - a.price);
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