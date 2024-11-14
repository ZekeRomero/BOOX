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

    await db.none(`
            CREATE TABLE IF NOT EXISTS "friends" (
                user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                friend_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, friend_id)
            );
        `);
    console.log("Table 'friends' created successfully.");
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

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});


// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
      // Default to login page.
      //return res.redirect('/login');
  }
  next();
};

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
  res.render('pages/register');
});

//Register

app.post('/register', async (req, res) => {
  const { username, fullname, password, confirmPassword } = req.body;

  //Check if passwords match
  if (password !== confirmPassword) {
      return res.redirect('/register?message=Passwords do not match');
  }

  try {

    //Check if the username already exists in the database
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      console.log('Username already exists');
      return res.redirect('/register');
    }

    //Hash the password and insert the new user into the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `INSERT INTO users (username, fullname, password) VALUES ($1, $2, $3)`;
    await db.none(insertQuery, [username, fullname, hashedPassword]);


      res.redirect('/login');
  } catch (error) {
      console.error('Error registering user:', error);
      res.redirect('/register?message=An error occurred. Please try again.');
  }
});

app.get('/homepage', auth, (req, res) => {
  res.render('pages/homepage');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

//ogin
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


app.post('/reviews/add', auth, (req, res) => {
  const book_id = parseInt(req.body.book_id); // Book ID from user input
  const rating = parseInt(req.body.rating); // Rating from user input
  const user_id = req.session.user.user_id; // to get the user_id from session

  db.tx(async t => {
    //Insert the new review into the reviews table
    await t.none('INSERT INTO reviews(book_id, rating, user_id) VALUES ($1, $2, $3);',
      [book_id, rating, user_id]);

    //Fetch reviews for the current user
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






//Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    //Default to login page.
    //return res.redirect('/login');
  }
  next();
};

//Authentication Required
app.use(auth);

//Add a friend
app.post('/friends/add', async (req, res) => {
  const friendUsername = req.body.friendUsername; //Extracts the username of the friend to be added from the request body
  const userId = req.session.user.user_id; //Retrieves the user_id from the current session, which identifies the logged-in user.

  try {
    // Find friend by username
    const friend = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [friendUsername]);//searches for user, check db returns null or single name, checks again for name

    if (!friend) {
      return res.render('pages/friends', { message: 'User not found.' });//print user notfound
    }

    //Insert friend relationship???
    await db.none('INSERT INTO friends(user_id, friend_id) VALUES ($1, $2)', [userId, friend.user_id]);//SQL query that inserts a record into the friends table. It creates a new relationship between the logged-in user (userId) and the found friend????
    res.redirect('/friends');
  } catch (error) {
    console.error('Error adding friend:', error);
    res.render('pages/friends', { message: 'Error adding friend.' });
  }
});

// Remove a friend
app.post('/friends/remove', async (req, res) => { //finds friends id
  const friendId = req.body.friendId;
  const userId = req.session.user.user_id;

  try {
    await db.none('DELETE FROM friends WHERE user_id = $1 AND friend_id = $2', [userId, friendId]);//sql deletes friend and matches userid and friendid
    res.redirect('/friends');
  } catch (error) {
    console.error('Error removing friend:', error);
    res.render('pages/friends', { message: 'Error removing friend.' });
  }
});

//view friends list
app.get('/friends', async (req, res) => {
  const userId = req.session.user.user_id;//retrieves userid

  try {
    const friends = await db.any(`
          SELECT users.username, users.fullname, users.user_id
          FROM friends
          JOIN users ON friends.friend_id = users.user_id
          WHERE friends.user_id = $1
      `, [userId]);//adds user,name,id to friends table. joins to friends id

    res.render('pages/friends', { friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.render('pages/friends', { friends: [], message: 'Error fetching friends list.' });
  }
});



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

app.post('/delete-account', async (req, res) => {
  if(!req.session.user) {
    return res.redirect('/login'); // redirect to login if not logged in
  }

  try{
    const userId = req.session.user.id;

    // delete user from database
    await db.none('DELETE FROM users WHERE id = $1', [userId]);

    // destroy session
    req.session.destroy(err => {
      if (err) {
        return res.render('settings', { message: 'An error occurred. Please try again.'});
    }

    res.render('pages/logout', { message: 'Your account has been successfully deleted.'});
    });
  } catch (error) {
      console.error('Error deleting account:', error);
      res.render('settings', { message: 'An error occurred while deleting your account.'});
  }
});

app.post('/change-username', async (req, res) => {
  if(!req.session.user) {
    return res.redirect('/login'); // redirect to login if not logged in
  }

  try{
    const userId = req.session.user.id;
    const newUsername = req.body['new-username'];

    // update username in database
    await db.none('UPDATE users SET username = $1 WHERE id = $2', [newUsername, userId]);

    // update session
    req.session.user.username = newUsername;

    res.render('settings', { message: 'Username successfully changed.' });
  } catch {
    console.error('Error changing username:', error);
    res.render('settings', { message: 'An error occurred while changing your username.'});
  }
});

app.post('/change-email', async (req, res) => {
  if(!req.session.user) {
    return res.redirect('/login'); // redirect to login if not logged in
  }

  try{
    const userId = req.session.user.id;
    const newEmail = req.body['new-email'];

    // update email in database
    await db.none('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);

    // update session
    req.session.user.email = newEmail;

    res.render('settings', { message: 'Email successfully changed.' });
  } catch {
    console.error('Error changing email:', error);
    res.render('settings', { message: 'An error occurred while changing your email.'});
  }
});

app.post('/change-password', async (req, res) => {
  if(!req.session.user) {
    return res.redirect('/login'); // redirect to login if not logged in
  }

  const newPassword = req.body['new-password'];
  const confirmNewPassword = req.body['confirm-new-password'];

  // Check if the new password and confirmation match
  if (newPassword !== confirmNewPassword) {
    return res.render('settings', { message: 'Passwords do not match.' });
  }

  try{
    const userId = req.session.user.id;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password in database
    await db.none('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.render('settings', { message: 'Password successfully changed.' });
  } catch {
    console.error('Error changing password:', error);
    res.render('settings', { message: 'An error occurred while changing your password.'});
  }
});

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
