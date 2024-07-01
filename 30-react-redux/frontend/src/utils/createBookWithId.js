import { v4 as uuidv4 } from 'uuid';
const createBookWithId = (book) => {
  const newBook = {
    ...book,
    id: uuidv4(),
    favorite: false,
  };
  return newBook;
};

export default createBookWithId;
