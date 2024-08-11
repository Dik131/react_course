import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TodoList from './components/Todos/TodoList';
import TodoForm from './components/Todos/TodoForm';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    if (text.trim()) {
      setTodos([
        ...todos,
        { id: uuidv4(), text: text.trim(), completed: false },
      ]);
      setText('');
    }
  };

  const deleteTodo = (todoId) => {
    setTodos(todos.filter((todo) => todo.id !== todoId));
  };

  const completeTodo = (todoId) => {
    setTodos(
      todos.map((todo) =>
        todo.id !== todoId ? todo : { ...todo, completed: !todo.completed }
      )
    );
  };

  return (
    <div className='App'>
      <h1>A simple Todo App</h1>
      {/* Todo Form */}
      <TodoForm text={text} handleTextChange={setText} handleSubmit={addTodo} />
      {/* Todo List */}
      <TodoList
        todos={todos}
        deleteTodo={deleteTodo}
        completeTodo={completeTodo}
      />
    </div>
  );
}

export default App;
