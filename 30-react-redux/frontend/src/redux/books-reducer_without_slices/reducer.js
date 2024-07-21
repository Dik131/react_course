import * as a from './actionTypes';

const initialState = [];

const booksReduser = (state = initialState, action) => {
  switch (action.type) {
    case a.ADD_BOOK:
      return [...state, action.payload];
    case a.DELETE_BOOK:
      return state.filter((book) => book.id !== action.payload);
    case a.TOGGLE_FAVORITE:
      return state.map((book) => {
        if (book.id === action.payload) {
          return {
            ...book,
            favorite: !book.favorite,
          };
        } else {
          return book;
        }
      });
    default:
      return state;
  }
};

export default booksReduser;
