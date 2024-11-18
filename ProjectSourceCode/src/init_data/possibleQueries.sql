/* Listing out the book based off book name from search bar */
SELECT book_name, year_of_release, author 
    FROM book 
    WHERE UPPER(book_name) LIKE '%%';
    
/*put whatever variable you're getting out of the search bar in between the % */
    /* make that input upper case */


/* Listing out all collections of a user */
SELECT shelf_name 
    FROM bookshelf b
    JOIN collections c
    ON b.shelf_id = c.shelf_id
    WHERE user_id = /*input from login page */


/* List out book names when you click on a collection based off the user */
SELECT book_name
    FROM book bb
    JOIN collections cc
    ON bb.book_id = cc.book_id
    WHERE user_id = /*input from login page */
    AND shelf_id = /* input from the collection they click on (some variable to distinguish which collection the user wants to see) */