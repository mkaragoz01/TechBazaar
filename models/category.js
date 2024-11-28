const sequelize = require('../utility/database');
const Sequelize = require('sequelize');


const Category = sequelize.define('categories',{
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: Sequelize.STRING,
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Category;