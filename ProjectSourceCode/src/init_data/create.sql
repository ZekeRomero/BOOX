CREATE TABLE users (
  user_id SERIAL PRIMARY KEY /* the primary key for each entry */,
  username VARCHAR(100) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE isbns (
    id SERIAL PRIMARY KEY,
    book_isbn VARCHAR(13) NOT NULL,
    book_name VARCHAR(100) NOT NULL
);


CREATE TABLE users_to_isbns (
    user_id INT NOT NULL,
    isbn_id INT NOT NULL
);

CREATE TABLE user_collections (
    user_id INT NOT NULL,
    store_type INT NOT NULL,
    book_isbn VARCHAR(13) NOT NULL
)

CREATE TABLE reviews (
  review_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  id INT NOT NULL,
  rating INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id), /* ensure referential integrity */ 
  FOREIGN KEY (id) REFERENCES isbns (id)
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,  -- Foreign key referencing reviews
    user_id INT NOT NULL,    -- Foreign key referencing users
    comment TEXT NOT NULL,   -- The comment text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for when the comment was created
    FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE,  -- On review deletion, delete the comments
    FOREIGN KEY (user_id) REFERENCES user (user_id)  -- Reference to the user who made the comment
);