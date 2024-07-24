import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
// import booksReducer from './books/reducer';
import booksReducer from "./slices/booksSlice";
import filterReducer from "./slices/filterSlice";
// import filterSlice from './slices/filterSlice';
import errorReducer from "./slices/errorSlice";

const rootReducer = combineReducers({
  books: booksReducer,
  filter: filterReducer,
  error: errorReducer,
});

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
export default store;
