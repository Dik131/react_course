import { v4 as uuidv4 } from 'uuid';
const createBookWithId = (book, source) => {
  const newBook = {
    ...book,
    source,
    id: uuidv4(),
    favorite: false,
  };
  return newBook;
};

export default createBookWithId;
