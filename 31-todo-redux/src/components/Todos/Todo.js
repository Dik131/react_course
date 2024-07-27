import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from 'react-icons/ri';
import styles from './Todo.module.css';

const Todo = ({ todo, deleteTodo, toggleTodo }) => {
  return (
    <div
      className={`${styles.todo} ${
        todo.completed ? styles.completedTodo : ''
      } ${todo.lineThrough ? styles.lineThrough : ''}`}
    >
      <RiTodoFill className={styles.todoIcon} />
      <div className={styles.todoText}>{todo.text}</div>
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => deleteTodo(todo.id)}
      />
      <RiCheckDoubleFill
        className={styles.checkIcon}
        onClick={() => toggleTodo(todo.id)}
      />
    </div>
  );
};

export default Todo;
