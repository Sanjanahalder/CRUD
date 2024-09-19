require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path'); // Added this import to handle paths

const app = express();
const PORT = process.env.PORT || 4000;

// database connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connected to the database'))
  .catch((error) => console.log('Error connecting to the database:', error));

const db = mongoose.connection;
db.on('error', (error) => console.log(error));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: 'my secret key',
    saveUninitialized: true,
    resave: false,
  })
);

// Session middleware to pass messages to views
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.set('view engine', 'ejs');

// Route prefix
app.use('', require('./routes/routes'));

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
