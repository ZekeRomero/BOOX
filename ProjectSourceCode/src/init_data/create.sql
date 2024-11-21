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