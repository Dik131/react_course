import axios from 'axios'; //for requests to API
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setError } from './errorSlice';

const initialState = {
  books: [],
  isLoadingViaAPI: false,
};
export const fetchBook = createAsyncThunk(
  'books/fetchBook',
  async (url, thunkAPI) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(setError(error.message));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    addBook: (state, action) => {
      state.books.push(action.payload);
    },
    deleteBook: (state, action) => {
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload),
      };
    },
    toggleFavorite: (state, action) => {
      state.books.forEach((book) => {
        if (book.id === action.payload) {
          book.favorite = !book.favorite;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBook.pending, (state) => {
      state.isLoadingViaAPI = true;
    });
    builder.addCase(fetchBook.rejected, (state) => {
      state.isLoadingViaAPI = false;
    });
  },
});

export const { addBook, deleteBook, toggleFavorite } = booksSlice.actions;

export const selectBooks = (state) => state.books.books;
export const selectIsLoadingViaAPI = (state) => state.books.isLoadingViaAPI;

export default booksSlice.reducer;
