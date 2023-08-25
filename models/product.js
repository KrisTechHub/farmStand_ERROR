const mongoose = require('mongoose');

const productSchema = mongoose.Schema({ //this is a schema
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        lowercase: true,
        enum: ['fruit', 'vegetable', 'dairy']
    }
});

const Product = mongoose.model('Product', productSchema); //a model

module.exports = Product; //export this module from this file to be used on other files