import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTodo, toggleTodo } from '../../redux/slices/todoSlice';
import styles from './Todo.module.css';

const Todo = () => {
  const todos = useSelector((state) => state.todos.todos);
  const dispatch = useDispatch();
  return (
    <div className={styles.todo}>
      <RiTodoFill className={styles.todoIcon} />
      <div>{todos.text}</div>
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => deleteTodo(dispatch(todos.id))}
      />
      <RiCheckDoubleFill
        className={styles.checkIcon}
        onClick={() => toggleTodo(dispatch(todos.id))}
      />
    </div>
  );
};

export default Todo;
