import styles from "./Todo.module.css";

const Todo = ({ todo, deleteTodo, index }) => {
  return (
    <div className={styles.todo} onDoubleClick={() => deleteTodo(index)}>
      <div className={styles.todoText}>{todo}</div>
    </div>
  );
};

export default Todo;
