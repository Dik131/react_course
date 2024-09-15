import { createSlice } from '@reduxjs/toolkit';

const toggleThemeSlice = createSlice({
  name: 'theme',
  initialState: 'light',
  reducers: {
    toggleTheme: (state) => {
      return state === 'light' ? 'dark' : 'light';
    },
  },
});

export const { toggleTheme } = toggleThemeSlice.actions;
export default toggleThemeSlice.reducer;
