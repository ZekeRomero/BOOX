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
  host: 'dpg-csvo7rd2ng1s73du5nu0-a', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};


const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful');
        obj.done();
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });
/*
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
      try {
        await db.none(`
            CREATE TABLE IF NOT EXISTS "User_ISBNs" (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
                isbn VARCHAR(13) NOT NULL
            );
        `);
        console.log("Table 'user_isbns' created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
  };
  const insertData = async () => {
    try {
      await db.none(`
        INSERT INTO "users" (username, fullname, password) 
        VALUES ('thatguy', 'Johnny Johnathon', 'password');
      `);
      console.log("User data inserted successfully.");
    } catch (error) {
      console.error("Error inserting user data:", error);
    }
  
    try {
      await db.none(`
        INSERT INTO "User_ISBNs" (user_id, isbn) VALUES 
        (1, '9780143127741'),
        (1, '9780307474278');
      `);
      console.log("ISBN data inserted successfully.");
    } catch (error) {
      console.error("Error inserting ISBN data:", error);
    }
  };

  

  createTable()
    .then(() => console.log("Database setup complete"))
    .catch(error => console.error("Database setup failed:", error));
  //insertData()
  */
// *****************************************************


// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use('/static', express.static('src'));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

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
      return res.redirect('/login');
  }
  next();
};
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
// *****************************************************
const password1 = '123';  // Replace with the actual password

bcrypt.hash(password1, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed password:', hash);
});



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
app.post('/assign-fav', async (req, res) => {
  const gottenisbn = req.body.isbn;
  try {
    console.log("hello");

    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.status(401).send("Unauthorized: No user logged in");
    }

    const userName = req.session.user.username; // `id` should map to the user's `user_id` in the database
    console.log(userName);
    console.log(gottenisbn);
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const result = await db.oneOrNone(userQuery, [userName]);
    const userId = result ? result.user_id : null; // Safely extract the user_id
    console.log(userId);
    await db.none(
      `
      INSERT INTO "user_collections" (user_id, store_type, book_isbn) 
      VALUES ($1, $2, $3)
      `,
      [userId, 1, gottenisbn]
    );
    console.log("Data inserted successfully.");
    res.redirect('/homepage');

  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("An error occurred while assigning the ISBN.");
  }
});


app.get('/book/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  let book;

  try {
    const response = await axios.get(`https://api2.isbndb.com/books/${isbn}`, {
      headers: { 'Authorization': "56937_dcb1ace02f9d3be8f6440ffbe1882eca" }
    });

     book = response.data.books[0]; // Assuming the API returns an array with one book per ISBN
    const bookDetails = {
      title: book.title || 'N/A',
      author: book.authors ? book.authors.join(', ') : 'N/A',
      year: book.date_published || 'N/A',
      isbn: book.isbn || 'N/A',
      publisher: book.publisher || 'N/A',
      subject: book.subjects ? book.subjects.join(', ') : 'N/A',
      coverLink: book.image || ''
    };
    const userName = req.session.user.username; // `id` should map to the user's `user_id` in the database
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const result = await db.oneOrNone(userQuery, [userName]);
    const userId = result ? result.user_id : null; // Safely extract the user_id
    const isFavorited = await checkIfBookIsFavorited(userId, isbn); // Example function
    bookDetails.isFavorited = isFavorited;
    

    res.render('pages/bookDetails', { book: bookDetails });
  } catch (error) {
    console.error(error);
    res.send('<h1>Error fetching book details. Please try again later.</h1>');
  }
});
async function checkIfBookIsFavorited(userId, isbn) {
  const result = await db.query('SELECT 1 FROM user_collections WHERE user_id = $1 AND store_type = 1 AND book_isbn = $2', [userId, isbn]);
  console.log(result.length);
  return result.length > 0;
};

app.get('/settings', (req, res) => {
  res.render('pages/settings');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

//Register

app.post('/register', async (req, res) => {
  const { username, fullname, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.render('pages/register', { message: 'Passwords do not match.' });
  }

  try {
    // Check if the username already exists in the database
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      console.log('Username already exists');
      return res.render('pages/register', { message: 'Username already exists.' });
    }

    // Hash the password and insert the new user into the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `INSERT INTO users (username, fullname, password) VALUES ($1, $2, $3)`;
    await db.none(insertQuery, [username, fullname, hashedPassword]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error registering user:', error);
    res.render('pages/register', { message: 'An error occurred. Please try again.' });
  }
});


app.get('/homepage', async (req, res) => {
  try {
    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userName = req.session.user.username;
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const result = await db.oneOrNone(userQuery, [userName]);
    const userId = result ? result.user_id : null;

    if (!userId) {
      return res.status(400).send("User not found.");
    }

    // Fetch the user's favorited ISBNs
    const favoritesQuery = `
      SELECT book_isbn 
      FROM user_collections 
      WHERE user_id = $1 AND store_type = 1
    `;
    const favoritedBooks = await db.any(favoritesQuery, [userId]);

    if (favoritedBooks.length === 0) {
      return res.render('pages/homepage', { books: [] });
    }

    // Fetch book details from the API for each ISBN
    const bookDetails = await Promise.all(
      favoritedBooks.map(async (fav) => {
        try {
          const response = await axios.get(`https://api2.isbndb.com/books/${fav.book_isbn}`, {
            headers: { 'Authorization': "56937_dcb1ace02f9d3be8f6440ffbe1882eca" }
          });
          const book = response.data.books[0]; // Assuming API returns an array
          return {
            title: book.title || 'N/A',
            isbn: book.isbn || 'N/A',
            coverLink: book.image || ''
          };
        } catch (error) {
          console.error(`Error fetching details for ISBN ${fav.book_isbn}:`, error);
          return null; // Handle cases where book details couldn't be fetched
        }
      })
    );

    const filteredBooks = bookDetails.filter((book) => book !== null);

    // Render the homepage with the detailed book data
    res.render('pages/homepage', { books: filteredBooks });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).send("An error occurred while fetching your favorites.");
  }
});



app.get('/login', (req, res) => {
  res.render('pages/login');
});

//ogin
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // Extract username and password from the request body

  try {
    // Query the database for the user with the given username
    const userQuery = 'SELECT * FROM users WHERE username = $1';
    const user = await db.oneOrNone(userQuery, [username]);

    // If no user is found, render login.hbs with an error message
    if (!user) {
      return res.render('pages/login', { message: 'User not found. Please register first.' });
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user.password);

    // If the passwords don't match, render login.hbs with an error message
    if (!match) {
      return res.render('pages/login', { message: 'Incorrect username or password.' });
    }

    // If authentication succeeds, save the user session and redirect to the homepage
    req.session.user = { id: user.userid, username: user.username }; // Save user info in the session
    req.session.save(); // Ensure the session is saved
    return res.redirect('/homepage'); // Redirect to the homepage
  } catch (error) {
    
    console.error('Error logging in:', error);
    return res.render('pages/login', { message: 'An error occurred, please try again.' });
  }
});

app.get('/account', auth,(req, res) => {
  res.render('pages/account');
});

app.get('/reviews', async (req, res) => {
  try {
    console.log('Attempting to fetch reviews...');
    
    const reviewsQuery = 'SELECT * FROM reviews';
    const reviews = await db.any(reviewsQuery);
    
    // Fetch comments for each review
    for (const review of reviews) {
      const commentsQuery = 'SELECT * FROM comments WHERE review_id = $1';
      const comments = await db.any(commentsQuery, [review.review_id]);
      review.comments = comments;
    }
    
    res.render('pages/reviews', { reviews: reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while processing your request.",
      details: error.message || 'Please try again later.'
    });
  }
});

app.post('/add-review', async (req, res) => {
  try {
    const { book_name, author, rating, message } = req.body;

    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.status(401).send("Unauthorized: No user logged in");
    }

    const userName = req.session.user.username; 
    console.log(userName);
    
    const insertQuery = `
      INSERT INTO reviews (review_id, book_name, author, rating, message)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await db.none(insertQuery, [generateUUID(), book_name, author, rating, message]);

    console.log("Review added successfully.");
    res.json({ status: "success", message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while processing your request.",
      details: error.message || 'Please try again later.'

    });
  }
});

app.post('/reviews/:review_id/comment', auth, async (req, res) => {
  const review_id = req.params.review_id;
  const { comment } = req.body;
  const user_id = req.session.user.user_id; // Get the current user's ID

  try {
    // Insert the comment into the database
    await db.none(
      'INSERT INTO comments (review_id, user_id, comment) VALUES ($1, $2, $3)',
      [review_id, user_id, comment]
    );

    // Respond with a success message
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add comment' });
  }
});



//Authentication Middleware.
//const auth = (req, res, next) => {
  //if (!req.session.user) {
    //Default to login page.
    //return res.redirect('/login');
 // }
 // next();
//};

//Authentication Required
app.use(auth);

//Add a friend
app.post('/friends/add', async (req, res) => {
  try {

    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.status(401).send("Unauthorized: No user logged in");
    }
    const friendUsername = req.body.username; //Extracts the username of the friend to be added from the request body
    const userName = req.session.user.username; // `id` should map to the user's `user_id` in the database
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const result = await db.oneOrNone(userQuery, [userName]);
    const user1Id = result ? result.user_id : null;
    const friendQuery = 'SELECT user_id FROM users WHERE username = $1';
    const friendresult = await db.oneOrNone(userQuery, [friendUsername]);
    const user2Id = friendresult ? friendresult.user_id : null;

    await db.none(
      `
      INSERT INTO "friends" (user1_id, user2_id) 
      VALUES ($1, $2)
      `,
      [user1Id,user2Id]
    );
    console.log("Friend added successfully.");
    res.redirect('/homepage');

  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("An error occurred while adding the friend");
  }
});

// Remove a friend
app.post('/friends/remove', async (req, res) => {
  try {
    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.status(401).send("Unauthorized: No user logged in");
    }

    const friendUsername = req.body.username; // Extracts the friend's username from the request body
    const userName = req.session.user.username; // Current logged-in user's username

    // Get the logged-in user's ID
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const userResult = await db.oneOrNone(userQuery, [userName]);
    const user1Id = userResult ? userResult.user_id : null;

    // Get the friend's user ID
    const friendQuery = 'SELECT user_id FROM users WHERE username = $1';
    const friendResult = await db.oneOrNone(friendQuery, [friendUsername]);
    const user2Id = friendResult ? friendResult.user_id : null;

    // Ensure both user IDs exist
    if (!user1Id || !user2Id) {
      return res.status(400).send("Invalid username provided.");
    }

    // Remove the friend relationship
    await db.none(
      `
      DELETE FROM friends 
      WHERE (user1_id = $1 AND user2_id = $2) 
         OR (user1_id = $2 AND user2_id = $1)
      `,
      [user1Id, user2Id]
    );

    console.log("Friend removed successfully.");
    res.redirect('/friends');

  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).send("An error occurred while removing the friend");
  }
});

//view friends list
app.get('/friends', async (req, res) => {
  try {
    // Ensure user data is present in the session
    if (!req.session.user) {
      return res.redirect('/login'); // Redirect to login if no user is logged in
    }

    const userName = req.session.user.username;

    // Get the logged-in user's ID
    const userQuery = 'SELECT user_id FROM users WHERE username = $1';
    const result = await db.oneOrNone(userQuery, [userName]);
    const userId = result ? result.user_id : null;

    if (!userId) {
      return res.render('pages/friends', { friends: [], message: 'User not found.' });
    }

    // Get friends for the user
    const friendsQuery = `
      SELECT 
        CASE 
          WHEN user1_id = $1 THEN user2_id 
          ELSE user1_id 
        END AS friend_id
      FROM friends
      WHERE user1_id = $1 OR user2_id = $1
    `;

    const friends = await db.manyOrNone(friendsQuery, [userId]);

    // Fetch usernames of friends
    let friendUsernames = [];
    if (friends.length > 0) {
      const friendIds = friends.map(f => f.friend_id);
      const usernamesQuery = `
        SELECT username 
        FROM users 
        WHERE user_id = ANY($1::int[])
      `;
      friendUsernames = await db.manyOrNone(usernamesQuery, [friendIds]);
    }

    // Render the 'friends' page with the retrieved data
    res.render('pages/friends', { friends: friendUsernames, message: null });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    res.render('pages/friends', { friends: [], message: 'An error occurred while fetching the friends list.' });
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
  res.render('pages/collections', { genres })

});

app.post('/delete-account', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('pages/login'); // Redirect to login if not logged in
  }

  try {
    const userId = req.session.user.user_id;

    // Delete user from database
    await db.none('DELETE FROM users WHERE user_id = $1', [userId]);

    // Destroy session after account deletion
    req.session.destroy(err => {
        if (err) {
            return res.render('pages/settings', { message: 'An error occurred. Please try again.' });
        }

        res.render('pages/logout', { message: 'Your account has been successfully deleted.' });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.render('pages/settings', { message: 'An error occurred while deleting your account. Please try again.' });
  }
});

app.post('/change-username', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('pages/login'); // Redirect to login if not logged in
  }

  try {
    const userId = req.session.user.user_id;
    const newUsername = req.body['new-username'];

    // update username in the database
    await db.none('UPDATE users SET username = $1 WHERE user_id = $2', [newUsername, userId]);

    // update session with new username
    req.session.user.username = newUsername;

    res.render('pages/settings', { message: 'Username successfully changed.' });
  } catch (error) {
    console.error('Error changing username:', error);
    res.render('pages/settings', { message: 'An error occurred while changing your username. Please try again.' });
  }
});

app.post('/change-password', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('pages/login'); // Redirect to login if not logged in
  }

  const newPassword = req.body['new-password'];
  const confirmNewPassword = req.body['confirm-new-password'];

  // Check if new password and confirmation match
  if (newPassword !== confirmNewPassword) {
    return res.render('pages/settings', { message: 'Passwords do not match.' });
  }

  try {
    const userId = req.session.user.user_id;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.none('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);

    res.render('pages/settings', { message: 'Password successfully changed.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.render('pages/settings', { message: 'An error occurred while changing your password. Please try again.' });
  }
});

app.post('/update-profile-picture', async (req, res) => {
  if (!req.session.user) {
      return res.redirect('pages/login');
  }

  const userId = req.session.user.user_id;
  const newProfilePicIndex = req.body.profileImage;

  try {
      // Update profile picture in database
      await db.none('UPDATE users SET profileImage = $1 WHERE user_id = $2', [newProfilePicIndex, userId]);

      // Update session
      req.session.user.profileImage = newProfilePicIndex;

      res.render('pages/settings', { message: 'Profile picture updated successfully.' });
  } catch (error) {
      console.error('Error updating profile picture:', error);
      res.render('pages/settings', { message: 'An error occurred while updating your profile picture. Please try again.' });
  }
});

app.post('/reset-profile-picture', async (req, res) => {
  if (!req.session.user) {
      return res.redirect('pages/login');
  }

  const userId = req.session.user.user_id;

  try {
      // Reset profile picture in database
      await db.none('UPDATE users SET profileImage = NULL WHERE user_id = $1', [userId]);

      // Update session
      req.session.user.profileImage = null;

      res.render('pages/settings', { message: 'Profile picture reset to default.' });
  } catch (error) {
      console.error('Error resetting profile picture:', error);
      res.render('pages/settings', { message: 'An error occurred while resetting your profile picture. Please try again.' });
  }
});

app.get('/settings', (req, res) => {
  if (!req.session.user) {
    return res.redirect('pages/login');
  }

  res.render('pages/settings', {
    user: req.session.user,
    profilePics: profilePics
  });
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
