import { configureStore, applyMiddleware } from '@reduxjs/toolkit';
import toggleThemeReducer from './slices/toggleThemeSlice';
import tasksReducer from './slices/tasksSlice';
import { get, set } from 'idb-keyval';

// Middleware to save state to IndexedDB after each action
const saveStateMiddleware = store => next => action => {
  const result = next(action);
  const state = store.getState();
  set('tasks', state.tasks);
  return result;
};

const store = configureStore({
    reducer: {
        theme: toggleThemeReducer,
        tasks: tasksReducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(saveStateMiddleware)
});

export default store;