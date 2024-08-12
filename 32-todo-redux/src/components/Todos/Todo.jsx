import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckboxCircleFill,
} from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { deleteTodo, completeTodo } from '../../redux/slices/todoSlice';
import styles from './Todo.module.css';

const Todo = ({ id, text, completed }) => {
  const dispatch = useDispatch();

  return (
    <div className={`${styles.todo} ${completed ? styles.completedTodo : ''}`}>
      <RiTodoFill className={styles.todoIcon} />
      <span className={styles.todoText}>{text}</span>
      <RiCheckboxCircleFill
        className={styles.checkIcon}
        onClick={() => dispatch(completeTodo({ id }))}
      />
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => dispatch(deleteTodo({ id }))}
      />
    </div>
  );
};

export default Todo;
