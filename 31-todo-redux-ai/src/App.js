import { useSelector } from 'react-redux';
import { selectTodos } from './redux/slices/todoSlice';
import TodoForm from "./components/Todos/TodoForm";
import TodoList from "./components/Todos/TodoList";
import TodosActions from './components/Todos/TodosActions';
import "./App.css";

function App() {
  const todos = useSelector(selectTodos);
  const hasTodos = todos.length > 0;

  return (
    <div className='App'>
      <h1>Todo App</h1>
      <TodoForm />
      {hasTodos && (
        <>
          <TodosActions />
          <TodoList />
        </>
      )}
    </div>
  );
}

export default App;
