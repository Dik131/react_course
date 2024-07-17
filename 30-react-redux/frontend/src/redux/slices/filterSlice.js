import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  title: '',
  author: '',
  onlyFavorite: false,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setTitleFilter: (state, action) => {
      // state = {
      //   title: action.payload,
      // };

      // return state;

      // the same as

      return { ...state, title: action.payload };

      // or ...

      // we can do like this, because we use immer library
      // state.title = action.payload;
    },
    setAuthorFilter: (state, action) => {
      return {
        ...state,
        title: action.payload,
      };
    },
    setOnlyFavorite(state, action) {
      state.onlyFavorite = action.payload;
    },
    clearFilter(state) {
      state.title = '';
      state.author = '';
      state.onlyFavorite = false;
    },
    resetFilters: (state) => {
      return initialState;
    },
  },
});

export const { setTitleFilter, resetFilters } = filterSlice.actions;

export const { setAuthorFilter } = filterSlice.actions;

export const { setOnlyFavorite } = filterSlice.actions;

export const { clearFilter } = filterSlice.actions;

export const selectTitleFilter = (state) => state.filter.title;

export default filterSlice.reducer;
