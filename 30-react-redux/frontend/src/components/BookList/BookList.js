import { useSelector, useDispatch } from 'react-redux';
import { BsBookmarkHeart, BsBookmarkHeartFill } from 'react-icons/bs';
import { deleteBook, toggleFavorite } from '../../redux/books/actionCreators';
import './BookList.css';
const BookList = () => {
  const books = useSelector((state) => state.books);
  const dispatch = useDispatch();
  const handleAddRandomBook = (id) => {
    dispatch(toggleFavorite(id));
  };
  const handleDeleteBook = (id) => {
    dispatch(deleteBook(id));
  };
  return (
    <div className='app-block book-list'>
      <h2>Book list</h2>
      <>
        {books.length === 0 ? (
          <p>No books found</p>
        ) : (
          <ul>
            {books.map((book, i) => (
              <li key={book.id}>
                <div className='book-info'>
                  {++i}. {book.title} by <strong>{book.author}</strong>
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
