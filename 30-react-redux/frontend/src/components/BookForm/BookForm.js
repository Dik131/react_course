import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaSpinner } from 'react-icons/fa';
// import { v4 as uuidv4 } from 'uuid';
// import { addBook } from '../../redux/books/actionCreators';
import { addBook, fetchBook } from '../../redux/slices/booksSlice';
import booksData from '../../data/books.json';
import createBookWithId from '../../utils/createBookWithId';
import './BookForm.css';
import { setError } from '../../redux/slices/errorSlice';

const BookForm = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  // if it's a lot of input fields, we can use next state to manage them
  // const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleAddRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * booksData.length);
    const randomBook = booksData[randomIndex];
    // const randomBookWithID = createBookWithId(randomBook);
    // const randomBookWithID = {
    //   ...randomBook,
    //   id: uuidv4(),
    //   favorite: false,
    // };
    dispatch(addBook(createBookWithId(randomBook, 'rng')));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (title && author) {
      // const book = createBookWithId({ title, author });
      // const book = {
      //   title,
      //   author,
      //   id: uuidv4(),
      //   favorite: false,
      // };

      dispatch(addBook(createBookWithId({ title, author }, 'manual'))); // {type: 'ADD_BOOK', payload: book}
      setAuthor('');
      setTitle('');
    } else {
      dispatch(setError('Title and author are required!'));
    }
  };

  //API request

  const handleAddBookViaAPI = async () => {
    try {
      setIsLoading(true);
      await dispatch(fetchBook('http://localhost:5000/random-book-delayed'));
    } finally {
      setIsLoading(false);
    }

    //   try {
    //     const response = await axios.get('http://localhost:5000/random-book');
    //     if (response?.data?.title && response?.data?.author) {
    //       dispatch(addBook(createBookWithId(response.data, 'API')));
    //     }
    //   } catch (error) {
    //     console.log('Error from API', error);
    //   }

    // same but with axios
    // fetch('localhost:5000/random-book', {)
    //   .then((response) => response.json())
    //   .then((data) => {
    //     console.log(data);
    //   });
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
        <br></br>
        <button type='submit'>Add a new book</button>
        <button type='button' onClick={handleAddRandomBook}>
          Random book
        </button>

        <button
          type='button'
          onClick={handleAddBookViaAPI}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span>Loading...</span>
              <FaSpinner className='spinner' />
            </>
          ) : (
            <>
              <span>Add book via API</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BookForm;
