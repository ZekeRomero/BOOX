const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

module.exports = app;

//  Connect to DB -->

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

const createTable = async () => {
      try {
          await db.none(`
              CREATE TABLE IF NOT EXISTS "users" (
                  user_id SERIAL PRIMARY KEY,  -- the primary key for each entry
                  username VARCHAR(100) NOT NULL,
                  fullname VARCHAR(100) NOT NULL,
                  password VARCHAR(100) NOT NULL
              );
          `);
          console.log("Table 'users' created successfully.");
      } catch (error) {
          console.error("Error creating table:", error);
      }
  };

  createTable()
    .then(() => console.log("Database setup complete"))
    .catch(error => console.error("Database setup failed:", error));
// *****************************************************


// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use('/static', express.static('src'));

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// *****************************************************



app.get('/', (req, res) => {
  if (req.session.user) {
      // If the user is logged in, render the home page or whatever page you want
      res.render('home', { user: req.session.user });
  } else {
      // If the user is not logged in, redirect to the login page
      res.redirect('/login');
  }
});

app.get('/searchtest', async (req, res) => {
  const query = req.query.query;

  try {
    const response = await axios.get(`https://api2.isbndb.com/books/${query}`, {
      headers: { 'Authorization': "56937_dcb1ace02f9d3be8f6440ffbe1882eca" }
    });

    const books = response.data.books.map(book => ({
      title: book.title || 'N/A',
      isbn: book.isbn || 'N/A',
      coverLink: book.image || ''
    }));

    res.render('pages/searchResults', { query, books });
  } catch (error) {
    console.error(error);
    res.send('<h1>Error fetching book data. Please try again later.</h1>');
  }
});


app.get('/book/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`https://api2.isbndb.com/books/${isbn}`, {
      headers: { 'Authorization': "56937_dcb1ace02f9d3be8f6440ffbe1882eca" }
    });

    const book = response.data.books[0]; // Assuming the API returns an array with one book per ISBN
    const bookDetails = {
      title: book.title || 'N/A',
      author: book.authors ? book.authors.join(', ') : 'N/A',
      year: book.date_published || 'N/A',
      isbn: book.isbn || 'N/A',
      publisher: book.publisher || 'N/A',
      subject: book.subjects ? book.subjects.join(', ') : 'N/A',
      coverLink: book.image || ''
    };

    res.render('pages/bookDetails', { book: bookDetails });
  } catch (error) {
    console.error(error);
    res.send('<h1>Error fetching book details. Please try again later.</h1>');
  }
});


app.get('/register', (req, res) => {
  const message = req.query.message;
  res.render('pages/register', { message });
});


// Register
app.post('/register', async (req, res) => {
  const { username, fullname, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
      return res.redirect('/register?message=Passwords do not match');
  }

  try {
      // Check if the username already exists in the database
      const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUser) {
          return res.redirect('/register?message=Username already exists');
      }

      // Hash the password and insert the new user into the database
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.none('INSERT INTO users (username, fullname, password) VALUES ($1, $2, $3)', [username, fullname, hashedPassword]);

      res.redirect('/login');
  } catch (error) {
      console.error('Error registering user:', error);
      res.redirect('/register?message=An error occurred. Please try again.');
  }
});


app.get('/login', (req, res) => {
    res.render('pages/login');
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const userQuery = 'SELECT * FROM users WHERE username = $1';
      const user = await db.oneOrNone(userQuery, [username]);

      if (!user) {
          return res.redirect('/register');
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
          return res.render('pages/login', { message: 'Incorrect username or password.' });
      }

      req.session.user = user;
      req.session.save();

      return res.redirect('/searchtest');

  } catch (error) {
      console.error('Error logging in:', error);
      return res.render('pages/login', { message: 'An error occurred, please try again.' });
  }
});


app.get('/reviews', (req, res) => { 
  const taken = req.query.taken; 
  
  db.any(`
    SELECT reviews.review_id, book.book_name, book.author, reviews.rating 
    FROM reviews
    JOIN book ON reviews.book_id = book.book_id
    WHERE reviews.user_id = $1
  `, [req.session.user.user_id]) 
  .then(reviews => { 
    res.render('pages/reviews', { 
      username: req.session.user.username, 
      reviews, 
      action: taken ? 'delete' : 'add', 
    }); 
  }) 
  .catch(err => { 
    res.render('pages/reviews', { 
      reviews: [], 
      username: req.session.user.username, 
      error: true, 
      message: err.message, 
    }); 
  }); 
});


app.post('/reviews/add', (req, res) => {
  const book_id = parseInt(req.body.book_id); // Book ID from user input
  const rating = parseInt(req.body.rating); // Rating from user input
  const user_id = req.session.user.user_id; // to get the user_id from session
    
  db.tx(async t => {
    // Insert the new review into the reviews table
    await t.none('INSERT INTO reviews(book_id, rating, user_id) VALUES ($1, $2, $3);', 
      [book_id, rating, user_id]);
  
    // Fetch reviews for the current user
    return t.any(`
      SELECT reviews.review_id, book.book_name, book.author, reviews.rating 
      FROM reviews
      JOIN book ON reviews.book_id = book.book_id
      WHERE reviews.user_id = $1
    `, [user_id]);
  })
  .then(reviews => {
    // If successful, render the reviews page with the updated list of reviews
    res.render('pages/reviews', {
      username: req.session.user.username,
      reviews,
      message: `Successfully added review for book ID ${book_id}`,
    });
  })
  .catch(err => {
    // If an error occurs, render the page with the error message
    res.render('pages/reviews', {
      username: req.session.user.username,
      reviews: [],
      error: true,
      message: err.message,
    });
  });
});


  

// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to login page.
        //return res.redirect('/login');
    }
    next();
};

// Authentication Required
app.use(auth);




app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
        }
        res.render('pages/logout');
    });
});

app.get('/collections', (req, res) => {
    const genres = ['Horror', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery']
    res.render('collections', { genres })
})

// for lab 11 test cases
app.get('/welcome', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome!'
  });
});
// *****************************************************

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');