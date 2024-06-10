import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from "react-icons/ri";
// import { FaCheck } from "react-icons/fa";
import styles from "./Todo.module.css";

const Todo = ({ todo, deleteTodo, toggleTodo, lineThroughState }) => {
  return (
    <div
      className={`${styles.todo} ${
        todo.completed ? styles.completedTodo : ""
      } ${todo.lineThrough ? styles.lineThrough : ""}`}
    >
      <RiTodoFill
        className={styles.todoIcon}
        onClick={() => lineThroughState(todo.id)}
      />
      <div className={styles.todoText}>{todo.text}</div>
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => deleteTodo(todo.id)}
      />
      {/* <FaCheck
        className={todo.completed ? 'line-through' : ''}>{todo.text}
        onClick={() => lineThrough(todo.id)}
      /> */}
      <RiCheckDoubleFill
        className={styles.checkIcon}
        onClick={() => toggleTodo(todo.id)}
      />
    </div>
  );
};

export default Todo;
