import { useSelector } from 'react-redux';
import Todo from './Todo';

const TodoList = () => {
  const todos = useSelector((state) => state.todos.todos);
  return (
    <div>
      {todos && todos.length === 0 && <h2>No Todos</h2>}
      {todos && todos.map((todo) => <Todo key={todo.id} {...todo} />)}
    </div>
  );
};

export default TodoList;
