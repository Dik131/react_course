import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTodo } from './redux/slices/todoSlice';
import TodoList from './components/Todos/TodoList';
import TodoForm from './components/Todos/TodoForm';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const dispatch = useDispatch();
  const addTask = () => {
    dispatch(addTodo({ text }));
    setText('');
  };
  return (
    <div className='App'>
      <h1>A simple Todo App</h1>
      <TodoForm text={text} handleTextChange={setText} handleSubmit={addTask} />
      <TodoList />
    </div>
  );
}

export default App;
