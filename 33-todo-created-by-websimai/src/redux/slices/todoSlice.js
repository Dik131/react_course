import { createSlice } from "@reduxjs/toolkit";

// Load todos from localStorage
const loadTodos = () => {
  try {
    const serializedTodos = localStorage.getItem('todos');
    if (serializedTodos === null) {
      return [];
    }
    return JSON.parse(serializedTodos);
  } catch (err) {
    console.error('Error loading todos from localStorage:', err);
    return [];
  }
};

// Save todos to localStorage
const saveTodos = (todos) => {
  try {
    const serializedTodos = JSON.stringify(todos);
    localStorage.setItem('todos', serializedTodos);
  } catch (err) {
    console.error('Error saving todos to localStorage:', err);
  }
};


const todoSlice = createSlice({
  name: 'todos',
  initialState: loadTodos(),
  reducers: {
    addTodo: (state, action) => {
      state.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
      saveTodos(state);
    },
    toggleTodo: (state, action) => {
      const todo = state.find((todo) => todo.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
        saveTodos(state);
      }
    },
    deleteTodo: (state, action) => {
      const newState = state.filter((todo) => todo.id !== action.payload);
      saveTodos(newState);
      return newState;
    },
    deleteCompleted: (state) => {
      const newState = state.filter((todo) => !todo.completed);
      saveTodos(newState);
      return newState;
    },
    resetAllTodos: (state) => {
      saveTodos([]);
      return [];
    },
  },
});

export const {
  addTodo,
  toggleTodo,
  deleteTodo,
  deleteCompleted,
  resetAllTodos,
} = todoSlice.actions;

export default todoSlice.reducer;