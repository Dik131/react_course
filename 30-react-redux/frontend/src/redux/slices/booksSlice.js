import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createBookWithId from "../../utils/createBookWithId";
import { setError } from "../slices/errorSlice";

const initialState = [];
export const fetchBook = createAsyncThunk(
  "books/fetchBook",
  async (url, thunkAPI) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(setError(error.message));
      throw error;
    }
  }
);

const booksSlice = createSlice({
  name: "books",
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
  // Option 1
  // extraReducers: {
  //   [fetchBook.fulfilled]: (state, action) => {
  //     if (action.payload.title && action.payload.author) {
  //       state.push(createBookWithId(action.payload, "API"));
  //     }
  //   },
  // },

  // Option 2
  extraReducers: (builder) => {
    builder.addCase(fetchBook.fulfilled, (state, action) => {
      if (action.payload.title && action.payload.author) {
        state.push(createBookWithId(action.payload, "API"));
      }
    });

    // builder.addCase(fetchBook.rejected, (state, action) => {
    //   console.log('Error from API', action.error);
    // });
  },
});

export const { addBook, deleteBook, toggleFavorite } = booksSlice.actions;

//we added createAsyncThunk instead of code below to fetch data from API
// export const thunkFunction = async (dispatch, getState) => {
//   try {
//     const response = await axios.get("http://localhost:5000/random-book");
//     if (response?.data?.title && response?.data?.author) {
//       dispatch(addBook(createBookWithId(response.data, "API")));
//     }
//   } catch (error) {
//     console.log("Error from API", error);
//   }
// };

export const selectBooks = (state) => state.books;
export default booksSlice.reducer;
