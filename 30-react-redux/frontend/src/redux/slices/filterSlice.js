import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  title: "",
  author: "",
  onlyFavorite: false,
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setTitleFilter: (state, action) => {
      // state = {
      //   title: action.payload,
      // };

      // return state;

      // the same as

      // return { ...state, title: action.payload };

      // or ...

      // we can do like this, because we use immer library
      state.title = action.payload;
    },
    setAuthorFilter: (state, action) => {
      // return { ...state, author: action.payload };

      state.author = action.payload;
    },
    setOnlyFavorite(state) {
      state.onlyFavorite = !state.onlyFavorite;
    },
    // clearFilter(state) {
    //   state.title = "";
    //   state.author = "";
    //   state.onlyFavorite = false;
    // },
    resetFilters: () => {
      return initialState;
    },
  },
});

export const {
  setTitleFilter,
  setAuthorFilter,
  setOnlyFavorite,
  resetFilters,
} = filterSlice.actions;

// export const { clearFilter } = filterSlice.actions;

export const selectTitleFilter = (state) => state.filter.title;
export const selectAuthorFilter = (state) => state.filter.author;
export const selectOnlyFavorite = (state) => state.filter.onlyFavorite;

export default filterSlice.reducer;
