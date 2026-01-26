require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: parseInt(process.env.SESSION_MAX_AGE) }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');

app.use('/', authRoutes);
app.use('/products', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));