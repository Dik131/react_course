<<<<<<< HEAD
import { createSlice } from "@reduxjs/toolkit";
=======
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
>>>>>>> c02dacb (moved todo state from app.js to slice)

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
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };
    },
    toggleTodo: (state, action) => {
      state.todos.forEach((todo) => {
        if (todo.id === action.payload) {
          todo.completed = !todo.completed;
        }
      });
    },
  },
});

export const { addTodo, deleteTodo, toggleTodo } = todosSlice.actions;

export const selectTodos = (state) => state.todos.todos;

export default todosSlice.reducer;
