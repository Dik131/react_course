import TodoForm from './components/Todos/TodoForm';
import TodoList from './components/Todos/TodoList';
import TodosActions from './components/Todos/TodosActions';
import './App.css';

function App() {
  return (
    <div className='App'>
      <h1>Todo App</h1>
      <TodoForm />
      {/* <TodosActions /> */}
      <TodoList />
    </div>
  );
}

export default App;
