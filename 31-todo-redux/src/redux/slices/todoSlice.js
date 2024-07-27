import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todos: [],
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.todos.push(action.payload);
    },
    deleteTodo: (state, action) => {
      return {
        ...state,
        books: state.todos.filter((todo) => todo.id !== action.payload),
      };
    },
    toggleFavorite: (state, action) => {
      state.todos.forEach((todo) => {
        if (todo.id === action.payload) {
          todo.favorite = !todo.favorite;
        }
      });
    },
  },
});

export const { addTodo, deleteTodo, toggleFavorite } = todosSlice.actions;

export const selectBooks = (state) => state.todos.books;

export default todosSlice.reducer;
