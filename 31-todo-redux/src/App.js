<<<<<<< HEAD
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
=======
<<<<<<< HEAD
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
>>>>>>> 7a0edcd (added logic for bookForm)
import {
  addTodo,
  toggleTodo,
  deleteTodo,
  selectTodos,
} from "./redux/slices/todoSlice";
import TodoForm from "./components/Todos/TodoForm";
import TodoList from "./components/Todos/TodoList";
import TodosActions from "./components/Todos/TodosActions";
import "./App.css";

function App() {
  const todos = useSelector(selectTodos);
  // const [todos, setTodos] = useState([]);
  const dispatch = useDispatch();
  const deleteTodoHandler = (id) => {
    //setTodos(todos.filter((todo) => todo.id !== id));
  };
  const toggleTodoHandler = (id) => {
    // setTodos(
    //   todos.map((todo) =>
    //     todo.id === id ? { ...todo, completed: !todo.completed } : { ...todo }
    //   )
    // );
  };
  const resetTodosHandler = () => {
    //setTodos([]);
  };

  const deleteCompletedTodosHandler = () => {
    //setTodos(todos.filter((todo) => !todo.completed));
  };

  const completedTodosCount = todos.filter((todo) => todo.completed).length;

=======
import TodoForm from './components/Todos/TodoForm';
import TodoList from './components/Todos/TodoList';
import TodosActions from './components/Todos/TodosActions';
import './App.css';

function App() {
>>>>>>> 1b214a1 (added logic for bookForm)
  return (
    <div className='App'>
      <h1>Todo App</h1>
      <TodoForm />
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 7a0edcd (added logic for bookForm)
=======
>>>>>>> a77f308 (the last commit for today)
      {!!todos.length && (
        <TodosActions completedTodosExists={!!completedTodosCount} />
      )}

      <TodoList />
      {completedTodosCount === 0 ? null : (
        <p>{`${completedTodosCount} completed ${
          completedTodosCount === 1 ? "todo" : "todos"
        }`}</p>
      )}
=======
      <TodosActions />
<<<<<<< HEAD
<<<<<<< HEAD
=======
      {/* <TodosActions /> */}
>>>>>>> 47dda6e (the last commit for today)
=======
>>>>>>> 7a0edcd (added logic for bookForm)
=======
=======
      {/* <TodosActions /> */}
>>>>>>> 47dda6e (the last commit for today)
>>>>>>> a77f308 (the last commit for today)
      <TodoList />
>>>>>>> 1b214a1 (added logic for bookForm)
    </div>
  );
}

export default App;
