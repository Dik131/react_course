import * as a from './actionTypes';

const initialState = [];

const booksReduser = (state = initialState, action) => {
  switch (action.type) {
    case a.ADD_BOOK:
      return [...state, action.payload];
    default:
      return state;
  }
};

export default booksReduser;
