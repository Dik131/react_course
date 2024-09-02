import { configureStore } from '@reduxjs/toolkit';
import toggleThemeReducer from './slices/toggleThemeSlice';
import tasksReducer from './slices/tasksSlice';

const store = configureStore({
    reducer: {
        theme: toggleThemeReducer,
        tasks: tasksReducer
    }
});

export default store;