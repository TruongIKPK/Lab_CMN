
const express = require('express');

const morgan = require('morgan');

const app = express();
const productRoutes = require("./routes/productRoutes");

app.set('view engine', 'ejs');

app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));

app.use('/', productRoutes );

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

module.exports = app;
