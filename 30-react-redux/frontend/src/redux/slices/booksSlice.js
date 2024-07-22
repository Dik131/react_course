import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createBookWithId from "../../utils/createBookWithId";

const initialState = [];

export const fetchBook = createAsyncThunk("books/fetchBook", async () => {
  const response = await axios.get("http://localhost:5000/random-book");
  return response.data;
});

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
  extraReducers: (builder) => {
    builder.addCase(fetchBook.fulfilled, (state, action) => {
      if (action.payload.title && action.payload.author) {
        state.push(createBookWithId(action.payload, "API"));
      }
    });
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
