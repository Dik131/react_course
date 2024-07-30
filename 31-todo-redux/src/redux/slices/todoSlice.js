<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 8468324 (moved todo state from app.js to slice)
=======
>>>>>>> 8468324 (moved todo state from app.js to slice)
import { createSlice } from "@reduxjs/toolkit";
=======
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c02dacb (moved todo state from app.js to slice)
>>>>>>> main
=======
import { createSlice } from "@reduxjs/toolkit";
>>>>>>> b53d729 (min changes)
=======
>>>>>>> c02dacb (moved todo state from app.js to slice)
>>>>>>> 8468324 (moved todo state from app.js to slice)
=======
import { createSlice } from "@reduxjs/toolkit";
>>>>>>> b53d729 (min changes)
=======
>>>>>>> c02dacb (moved todo state from app.js to slice)
>>>>>>> 8468324 (moved todo state from app.js to slice)

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
<<<<<<< HEAD
<<<<<<< HEAD
      const index = state.todos.findIndex((todo) => todo.id === action.payload);
      state.todos[index].completed = !state.todos[index].completed;
      state.todos[index].lineThrough = !state.todos[index].lineThrough;
=======
      state.todos.forEach((todo) => {
        if (todo.id === action.payload) {
          todo.completed = !todo.completed;
        }
      });
>>>>>>> b53d729 (min changes)
=======
      const index = state.todos.findIndex((todo) => todo.id === action.payload);
      state.todos[index].completed = !state.todos[index].completed;
      state.todos[index].lineThrough = !state.todos[index].lineThrough;
>>>>>>> a77f308 (the last commit for today)
    },
  },
});

export const { addTodo, deleteTodo, toggleTodo } = todosSlice.actions;

export const selectTodos = (state) => state.todos.todos;

export default todosSlice.reducer;
