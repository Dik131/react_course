import { createSlice } from '@reduxjs/toolkit';

const toggleThemeSlice = createSlice({
    name: 'toggleTheme',
    initialState: 'light',
    reducers: {
        toggleTheme: (state) => {
            return state === 'light' ? 'dark' : 'light';
        }
    }
});

export const { toggleTheme } = toggleThemeSlice.actions;
export default toggleThemeSlice.reducer;
