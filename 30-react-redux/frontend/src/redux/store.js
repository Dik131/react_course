import { configureStore } from '@reduxjs/toolkit';
// import booksReducer from './books/reducer';
import booksReducer from './slices/booksSlice';
import filterReducer from './slices/filterSlice';
// import filterSlice from './slices/filterSlice';
import errorReducer from './slices/errorSlice';

const store = configureStore({
  reducer: {
    books: booksReducer,
    filter: filterReducer,
    error: errorReducer,
  },
});

export default store;
