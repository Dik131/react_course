import { configureStore } from '@reduxjs/toolkit';
import toggleThemeReducer from './slices/toggleThemeSlice';

const store = configureStore({
    reducer: {
        theme: toggleThemeReducer
    }
});

export default store;