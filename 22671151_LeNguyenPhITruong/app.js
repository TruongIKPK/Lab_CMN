
const express = require('express');

const morgan = require('morgan');

const app = express();
const productRoutes = require("./routes/productRoutes");

const PORT = process.env.PORT;

app.set('view engine', 'ejs');

app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));

app.use('/', productRoutes );

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
