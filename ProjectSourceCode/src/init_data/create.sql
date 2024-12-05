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
);

CREATE TABLE friends (
    user1_id INT NOT NULL,
    user2_id INT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id VARCHAR(36) PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    username VARCHAR(255)
);



CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_review_id ON comments(review_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
