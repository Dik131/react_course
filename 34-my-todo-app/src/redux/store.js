import { configureStore} from '@reduxjs/toolkit';
import toggleThemeReducer from './slices/toggleThemeSlice';
import tasksReducer from './slices/tasksSlice';
import {saveStateMiddleware} from './slices/tasksSlice';

const store = configureStore({
    reducer: {
        theme: toggleThemeReducer,
        tasks: tasksReducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(saveStateMiddleware)
});

export default store;