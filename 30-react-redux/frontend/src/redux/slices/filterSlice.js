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
      return {
        ...state,
        title: action.payload,
      };
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
  },
});

export const { setTitleFilter } = filterSlice.actions;

export const { setAuthorFilter } = filterSlice.actions;

export const { setOnlyFavorite } = filterSlice.actions;

export const { clearFilter } = filterSlice.actions;

export default filterSlice.reducer;
