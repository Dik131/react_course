import { configureStore } from '@reduxjs/toolkit';
import tasksSlice from './slices/tasksSlice';
import { createIndexedDBMiddleware } from './middleware/indexedDBMiddleware';

const indexedDBMiddleware = createIndexedDBMiddleware('myAppDB', 'tasks');

const store = configureStore({
  reducer: {
    tasks: tasksSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(indexedDBMiddleware),
});

export default store;
