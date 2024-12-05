INSERT INTO users (username, fullname, password)
VALUES ('thatguy', 'Johnny Johnathon', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'), --password is password
('john_doe', 'John Doe', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'),
('jane_smith', 'Jane Smith', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'),
('alice_williams', 'Alice Williams', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'),
('bob_brown', 'Bob Brown', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'),
('susan_jones', 'Susan Jones', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'),
('otherguy', 'Name Name', '$2a$10$b.XhuOV5nWMw4XoAcKkDge42/2D8YuaK9zzXazfFtvLMdtMGLJ7Mi'); --password is 123


INSERT INTO isbns (id, book_isbn, book_name)
VALUES
(1, 0060935464, 'To Kill a Mockingbird'),
(2, 1781100489, 'Harry Potter and the Sorcerers Stone'),
(3, 1781100500, 'Harry Potter and the Chamber of Secrets'),
(4, 1781100527, 'Harry Potter and the Goblet of Fire'),
(5, 1781100519, 'Harry Potter and the Prisoner of Azkaban'),
(6, 1781100535, 'Harry Potter and the Order of the Phoenix'),
(7, 1781102430, 'Harry Potter and the Deathly Hallows');


INSERT INTO users_to_isbns(user_id, isbn_id)
VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);


INSERT INTO reviews (review_id, book_name, message, username)
VALUES
  ('5', 'The Great Gatsby', 'A timeless classic that explores themes of love, wealth, and the American Dream. Highly recommend!', 'otherguy'),
  ('4', 'To Kill a Mockingbird', 'An incredible story of racial injustice and moral growth. A must-read for everyone.', 'otherguy'),
  ('3', '1984', 'A chilling dystopian novel that explores the dangers of totalitarianism. Very thought-provoking.', 'otherguy'),
  ('2', 'Moby-Dick', 'A complex and philosophical story of obsession. Not for everyone, but worth the read for those who enjoy deep themes.', 'otherguy'),
  ('1', 'Pride and Prejudice', 'A brilliant romance novel that also critiques societal norms and class issues. A favorite of mine.', 'otherguy');
