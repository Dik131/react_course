import { useSelector } from 'react-redux';
import { selectTodos } from '../../redux/slices/todoSlice';
import Todo from './Todo';

const TodoList = () => {
  const todos = useSelector(selectTodos);
  return (
    <div>
      <Todo />
    </div>
  );
};

export default TodoList;
