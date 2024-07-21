import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    addBook: (state, action) => {
      state.push(action.payload);
    },
    deleteBook: (state, action) => {
      return state.filter((book) => book.id !== action.payload);
    },
    toggleFavorite: (state, action) => {
      state.forEach((book) => {
        if (book.id === action.payload) {
          book.favorite = !book.favorite;
        }
      });
      // same as
      //   return state.map((book) => {
      //     if (book.id === action.payload) {
      //       return {
      //         ...book,
      //         favorite: !book.favorite,
      //       };
      //     } else {
      //       return book;
      //     }
      //   });
    },
  },
});

export const { addBook, deleteBook, toggleFavorite } = booksSlice.actions;
export const selectBooks = (state) => state.books;
export default booksSlice.reducer;
