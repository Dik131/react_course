import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTodo, toggleTodo } from '../../redux/slices/todoSlice';
import styles from './Todo.module.css';

const Todo = () => {
  const todo = useSelector((state) => state.todos.todos[0]);
  const dispatch = useDispatch();
  const deleteTodo = (id) => dispatch(deleteTodo(id));
  const toggleTodo = (id) => dispatch(toggleTodo(id));
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
