import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  todos: [],
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.todos.push({
        id: uuidv4(),
        text: action.payload.text,
        completed: false,
      });
    },
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload.id);
    },
    completeTodo: (state, action) => {
      state.todos = state.todos.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    },
    resetTodos: (state) => {
      state.todos = [];
    },
    deleteCompletedTodos: (state) => {
      state.todos = state.todos.filter((todo) => !todo.completed);
    },
  },
});

export const {
  addTodo,
  deleteTodo,
  completeTodo,
  resetTodos,
  deleteCompletedTodos,
} = todoSlice.actions;

export default todoSlice.reducer;
