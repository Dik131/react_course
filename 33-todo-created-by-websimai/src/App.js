import { useSelector } from "react-redux";
import TodoList from "./components/Todos/TodoList";
import TodoInput from "./components/Todos/TodoInput";
import TodoActions from "./components/Todos/TodosActions";
import "./App.css";

const App = () => {
  const todos = useSelector((state) => state.todos);
  const hasTodos = todos && todos.length > 0;

  return (
    <div className='App'>
      <h1>Todo App</h1>
      <TodoInput />
      {hasTodos && (
        <>        
        <TodoActions />
        </>
        )}
      <TodoList />
    </div>
  );
}

export default App;

