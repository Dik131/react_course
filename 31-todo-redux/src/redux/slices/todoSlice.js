<<<<<<< HEAD
import { createSlice } from "@reduxjs/toolkit";
=======
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
<<<<<<< HEAD
=======
>>>>>>> c02dacb (moved todo state from app.js to slice)
>>>>>>> main

const initialState = {
  todos: [],
};

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.todos.push({
        id: uuidv4(),
        text: action.payload,
        completed: false,
        lineThrough: false,
      });
    },
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload);
    },
    toggleTodo: (state, action) => {
      const index = state.todos.findIndex((todo) => todo.id === action.payload);
      state.todos[index].completed = !state.todos[index].completed;
      state.todos[index].lineThrough = !state.todos[index].lineThrough;
    },
  },
});

export const { addTodo, deleteTodo, toggleTodo } = todosSlice.actions;

export const selectTodos = (state) => state.todos.todos;

export default todosSlice.reducer;
