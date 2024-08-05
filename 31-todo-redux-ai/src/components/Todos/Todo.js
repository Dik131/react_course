import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { deleteTodo, toggleTodo } from '../../redux/slices/todoSlice';
import styles from './Todo.module.css';

const Todo = ({ todo }) => {
  const dispatch = useDispatch();
  return (
    <div className={styles.todo}>
      <RiTodoFill className={styles.todoIcon} />
      <div>{todo.text}</div>
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => dispatch(deleteTodo(todo.id))}
      />
      <RiCheckDoubleFill
        className={styles.checkIcon}
        onClick={() => dispatch(toggleTodo(todo.id))}
      />
    </div>
  );
};

export default Todo;
