import { useDispatch } from "react-redux";
import { toggleTodo, deleteTodo } from "../../redux/slices/todoSlice";
import styles from "./TodoItem.module.css";

const TodoItem = ({ todo }) => {
  const dispatch = useDispatch();

  return (
    <li className={styles.todoItem}>
      <span
        style={{
          textDecoration: todo.completed ? 'line-through' : 'none',
        }}
      >
        {todo.text}
      </span>
      <div>
        <button onClick={() => dispatch(toggleTodo(todo.id))}>
          {todo.completed ? 'Undo' : 'Complete'}
        </button>
        <button onClick={() => dispatch(deleteTodo(todo.id))}>
          Delete
        </button>
      </div>
    </li>
  );
};

export default TodoItem;
