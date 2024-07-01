import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { addBook } from '../../redux/books/actionCreators';
import booksData from '../../data/books.json';
import './BookForm.css';
const BookForm = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  // if it's a lot of input fields, we can use next state to manage them
  // const [formData, setFormData] = useState({});

  const dispatch = useDispatch();

  const handleAddRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * booksData.length);
    const randomBook = booksData[randomIndex];
    const randomBookWithID = {
      ...randomBook,
      id: uuidv4(),
      favorite: false,
    };
    dispatch(addBook(randomBookWithID));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (title && author) {
      const book = {
        title,
        author,
        id: uuidv4(),
        favorite: false,
      };

      dispatch(addBook(book)); // {type: 'ADD_BOOK', payload: book}

      setAuthor('');
      setTitle('');
    }
  };
  return (
    <div className='app-block book-form'>
      <h2>Add a new book</h2>

      <form onSubmit={handleSubmit}>
        <>
          <label htmlFor='title'>Title:</label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder='Title'
          />
        </>
        <>
          <label htmlFor='author'>Author:</label>
          <input
            type='text'
            id='author'
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder='Author'
          />
        </>
        <button type='submit'>Add a new book</button>
        <button type='button' onClick={handleAddRandomBook}>
          Random book
        </button>
      </form>
    </div>
  );
};

export default BookForm;
