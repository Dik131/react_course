import { useSelector, useDispatch } from "react-redux";
import { BsBookmarkHeart, BsBookmarkHeartFill } from "react-icons/bs";
import { deleteBook, toggleFavorite } from "../../redux/books/actionCreators";
import {
  selectTitleFilter,
  selectAuthorFilter,
} from "../../redux/slices/filterSlice";
import "./BookList.css";
const BookList = () => {
  const books = useSelector((state) => state.books);
  const titleFilter = useSelector(selectTitleFilter);
  const authorFilter = useSelector(selectAuthorFilter);
  const dispatch = useDispatch();
  const handleAddRandomBook = (id) => {
    dispatch(toggleFavorite(id));
  };
  const handleDeleteBook = (id) => {
    dispatch(deleteBook(id));
  };

  const filteredBooks = books.filter((book) => {
    const matchesTitle = book.title
      .toLowerCase()
      .includes(titleFilter.toLowerCase());
    // console.log({ title: book.title, titleFilter, matchesTitle });
    const matchesAuthor = book.author
      .toLowerCase()
      .includes(authorFilter.toLowerCase());
    return matchesTitle, matchesAuthor;
  });

  return (
    <div className='app-block book-list'>
      <h2>Book list</h2>
      <>
        {books.length === 0 ? (
          <p>No books found</p>
        ) : (
          <ul>
            {filteredBooks.map((book, i) => (
              <li key={book.id}>
                <div className='book-info'>
                  {++i}. <strong>{book.title}</strong> by{" "}
                  <strong>{book.author}</strong>
                </div>
                <div className='book-actions'>
                  <span onClick={() => handleAddRandomBook(book.id)}>
                    {book.favorite ? (
                      <BsBookmarkHeartFill className='heart-icon' />
                    ) : (
                      <BsBookmarkHeart className='heart-icon' />
                    )}
                  </span>
                  <button onClick={() => handleDeleteBook(book.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    </div>
  );
};

export default BookList;
