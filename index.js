const express = require('express');
const app = express();
const path = require('path');
const Product = require('./models/product')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const appError = require('./appError');
const { wrap } = require('module');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/farmStand2'); // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  console.log("connected to mongo");
}


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended : true })) // middleware for parsing
app.use(methodOverride('_method')) //middleware to override with POST having ?_method=PATCH


const categories = ['fruit', 'vegetable', 'dairy'];


app.get('/products', async (req, res) => { //query the product model
    const { category } = req.query;
    if (category) {
        const products = await Product.find({ category }) //to get/find all products, await for mongoose operation
        res.render('products/index',  { products, category }); //2nd argument is to let index.ejs access 'products'
    } else {
        const products = await Product.find({ }) //to get/find all products, await for mongoose operation
        res.render('products/index',  { products, category: 'All' }); //2nd argument is to let index.ejs access 'products'
    };
})

app.get('/products/new', (req, res) => { //for creating new product
    res.render('products/new', { categories })
})

app.post('/products', wrapAsync(async(req, res, next) => { //route for the post request in new.ejs
        const newProduct = new Product(req.body) //make new product
        await newProduct.save(); //save and add the new product to database
        res.redirect(`/products/${newProduct._id}`) //go back to product lists
}))

function wrapAsync(fn) { //function for the try-catch
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}

app.get('/products/:id', wrapAsync(async (req, res, next) => { //to view each product
        const { id } = req.params; //define Id
        const product = await Product.findById(id) //find the id
        if (!product) {
            return next(new appError('Product not found', 404));
        }
        res.render('products/show', { product });
}))

app.get('/products/:id/edit', wrapAsync(async (req, res, next) => {
        const { id } = req.params; //define Id
        const product = await Product.findById(id) //find the id
        if (!product) {
                throw new appError('Product not found', 404);
        }
        res.render('products/edit', { product, categories })
}))

app.put('/products/:id', wrapAsync(async (req, res) => { //route for the put request on edit.ejs
    const { id } = req.params; //define Id
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {runValidators : true, new: true}) //find the id, use new:true to not include old info
    await updatedProduct.save();
    res.redirect(`/products/${updatedProduct._id}`)
}))

app.delete('/products/:id', wrapAsync(async (req, res) => {
    const { id } = req.params; //define Id
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
}))

const handleValidationErr = err => {
    console.log(err);
    return new appError(`Validation Failed...${err.message}`, 400)
}


app.use((err, req, res, next) => { //mongosh error handler
    console.log(err.name);
    if (err.name === 'ValidationError') err = handleValidationErr(err)
    next(err);
})


app.use((err, req, res, next) => { //Next() error handling middleware, with err param, express will view it as error handling middleware
    const { status = 500 , message = 'Something went wrong' } = err;
    res.status(status).send(message);
});


app.listen(3000, () => {console.log("on port 3000");})
