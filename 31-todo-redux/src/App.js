import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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

  return (
    <div className='App'>
      <h1>Todo App</h1>
      <TodoForm />
      {!!todos.length && (
        <TodosActions completedTodosExists={!!completedTodosCount} />
      )}

      <TodoList />
      {completedTodosCount === 0 ? null : (
        <p>{`${completedTodosCount} completed ${
          completedTodosCount === 1 ? "todo" : "todos"
        }`}</p>
      )}
    </div>
  );
}

export default App;
