import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckboxCircleFill,
} from 'react-icons/ri';
import styles from './Todo.module.css';

const Todo = ({ id, text, completed, deleteTodo, completeTodo }) => {
  return (
    <div className={`${styles.todo} ${completed ? styles.completedTodo : ''}`}>
      <RiTodoFill className={styles.todoIcon} />
      <span className={styles.todoText}>{text}</span>
      <RiCheckboxCircleFill
        className={styles.checkIcon}
        onClick={() => completeTodo(id)}
      />
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => deleteTodo(id)}
      />
    </div>
  );
};

export default Todo;
