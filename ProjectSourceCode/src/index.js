const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Register `ExpressHandlebars` instance and configure layouts and partials
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Database configuration using DATABASE_URL
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const db = pgp(dbConfig);

// Test database connection
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.error('ERROR connecting to the database:', error.message || error);
  });

// Set up Handlebars as the view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('src'));
app.use('/resources', express.static(path.join(__dirname, 'resources')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// Middleware to attach user data to response locals
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Authentication middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Utility to generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/homepage');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('pages/login', { message: 'Invalid username or password.' });
    }
    req.session.user = { id: user.user_id, username: user.username };
    res.redirect('/homepage');
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { message: 'An error occurred. Please try again.' });
  }
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const { username, fullname, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('pages/register', { message: 'Passwords do not match.' });
  }
  try {
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.render('pages/register', { message: 'Username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.none('INSERT INTO users (username, fullname, password) VALUES ($1, $2, $3)', [
      username,
      fullname,
      hashedPassword,
    ]);
    res.redirect('/login');
  } catch (error) {
    console.error('Register error:', error);
    res.render('pages/register', { message: 'An error occurred. Please try again.' });
  }
});

app.get('/homepage', auth, async (req, res) => {
  try {
    const user = req.session.user;
    const userFavorites = await db.any(
      `SELECT book_isbn FROM user_collections WHERE user_id = (
        SELECT user_id FROM users WHERE username = $1
      ) AND store_type = 1`,
      [user.username]
    );
    const books = await Promise.all(
      userFavorites.map(async (fav) => {
        try {
          const response = await axios.get(`https://api2.isbndb.com/books/${fav.book_isbn}`, {
            headers: { Authorization: process.env.API_KEY },
          });
          return response.data.books[0];
        } catch {
          return null;
        }
      })
    );
    res.render('pages/homepage', { books: books.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.render('pages/homepage', { books: [], message: 'An error occurred.' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/homepage');
    }
    res.redirect('/login');
  });
});

// Other routes as required

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
