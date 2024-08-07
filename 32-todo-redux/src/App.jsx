import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const addTodo = (e) => {
    e.preventDefault();
    if (text.trim()) {
      setTodos([...todos, { id: uuidv4(), text: text.trim(), completed: false }]);
      setText("");
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const completeTodo = (id) => {
    setTodos(todos.map((todo) => todo.id === id ? { ...todo, completed: true } : todo));
  };

  return (
    <div className="App">
      <h1>A simple Todo App</h1>
      {/* Todo Form */}
      <form onSubmit={addTodo}>
        <input
          placeholder="Enter Todo"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" title="Add Todo" disabled={!text.trim()}>
          Add Todo
        </button>
      </form>

      {/* Todo List */}
      {todos.length === 0 ? (
        <h2>No Todos</h2>
      ) : (
        todos.map((todo) => (
          <li key={todo.id}>
            <input type="checkbox" className="checkbox" checked={todo.completed} onChange={() => completeTodo(todo.id)} />
            <span>{todo.text}</span>
            <span className="delete" onClick={() => deleteTodo(todo.id)}>&times;</span>
          </li>
        ))
      )}
    </div>
  );
}



export default App;