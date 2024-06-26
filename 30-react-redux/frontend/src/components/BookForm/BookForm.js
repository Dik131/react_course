import { useState } from "react";
import "./BookForm.css";
const BookForm = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  // if it's a lot of input fields, we can use next state to manage them
  // const [formData, setFormData] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    if (title && author) {
      console.log(title, author);
      setAuthor("");
      setTitle("");
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
      </form>
    </div>
  );
};

export default BookForm;
