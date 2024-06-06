import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TodoForm from "./components/Todos/TodoForm";
import TodoList from "./components/Todos/TodoList";
import TodosActions from "./components/Todos/TodosActions";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);

  const addTodoHandler = (text) => {
    const newTodo = {
      text,
      completed: false,
      lineThrough: false,
      id: uuidv4(),
    };
    setTodos([...todos, newTodo]);
  };
  const deleteTodoHandler = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };
  const toggleTodoHandler = (id) => {
    setTodos(
      todos.map(
        (todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : { ...todo } // return original todo;
      )
    );
  };
  // const lineThroughHandler = (id) => {
  //   setTodos(
  //     todos.map((todo) =>
  //       todo.id === id
  //         ? { ...todo, lineThrough: !todo.lineThrough }
  //         : { ...todo }
  //     )
  //   );
  // };
  const resetTodosHandler = () => {
    setTodos([]);
  };

  const deleteCompletedTodosHandler = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const completedTodosCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className="App">
      <h1>Todo App</h1>
      <TodoForm addTodo={addTodoHandler} />
      {!!todos.length && (
        <TodosActions
          completedTodosExists={!!completedTodosCount}
          resetTodos={resetTodosHandler}
          deleteTodos={deleteCompletedTodosHandler}
        />
      )}

      <TodoList
        todos={todos}
        deleteTodo={deleteTodoHandler}
        toggleTodo={toggleTodoHandler}
      />
      {completedTodosCount === 0 ? null : (
        <p>{`${completedTodosCount} completed ${
          completedTodosCount === 1 ? "todo" : "todos"
        }`}</p>
      )}
    </div>
  );
}

export default App;
