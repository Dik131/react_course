import { useSelector, useDispatch } from 'react-redux';
import { BsBookmarkHeart, BsBookmarkHeartFill } from 'react-icons/bs';
// import { deleteBook, toggleFavorite } from '../../redux/books/actionCreators';
import {
  deleteBook,
  toggleFavorite,
  selectBooks,
} from '../../redux/slices/booksSlice';
import {
  selectTitleFilter,
  selectAuthorFilter,
  selectOnlyFavorite,
} from '../../redux/slices/filterSlice';
import './BookList.css';
const BookList = () => {
  const books = useSelector(selectBooks);
  const titleFilter = useSelector(selectTitleFilter);
  const authorFilter = useSelector(selectAuthorFilter);
  const onlyFavorite = useSelector(selectOnlyFavorite);
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
    const matchesFavorite = onlyFavorite ? book.favorite : true;
    return matchesTitle && matchesAuthor && matchesFavorite;
  });

  const hightlightMatchedText = (text, filter) => {
    if (!filter) {
      return text;
    }
    const regex = new RegExp(`(${filter})`, 'gi'); // 'g' for global, 'i' for case insensitive
    return text.split(regex).map((substring, index) => {
      if (substring.toLowerCase() === filter.toLowerCase()) {
        return (
          <span key={index} className='highlight'>
            {substring}
          </span>
        );
      }
      return substring;
    });
  };
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
                  {++i}.{' '}
                  <strong>
                    <i>{hightlightMatchedText(book.title, titleFilter)}</i>
                  </strong>{' '}
                  by{' '}
                  <strong>
                    {hightlightMatchedText(book.author, authorFilter)}
                  </strong>
                  ({book.source})
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
