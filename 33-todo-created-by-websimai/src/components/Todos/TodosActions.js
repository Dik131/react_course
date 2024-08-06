import { useDispatch } from "react-redux";
import { deleteCompleted, resetAllTodos } from "../../redux/slices/todoSlice";
import styles from "./TodosActions.module.css";

const TodoActions = () => {
  const dispatch = useDispatch();

  return (
    <div className={styles.todoActions}>
      <button
        className={styles.actionButton}
        onClick={() => dispatch(deleteCompleted())}
      >
        Delete Completed
      </button>
      <button
        className={styles.actionButton}
        onClick={() => dispatch(resetAllTodos())}
      >
        Reset All Todos
      </button>
    </div>
  );
};

export default TodoActions;
