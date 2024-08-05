import { useSelector } from 'react-redux';
import { selectTodos } from '../../redux/slices/todoSlice';
import Todo from './Todo';

const TodoList = () => {
  const todos = useSelector(selectTodos);
  return (
    <div>
      {todos.map(todo => (
        <Todo key={todo.id} {...todo} />
      ))}
    </div>
  );
};

export default TodoList;