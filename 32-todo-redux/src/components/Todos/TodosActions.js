import { RiDeleteBin2Line, RiRefreshLine } from "react-icons/ri";
import Button from "../UI/Button";
import styles from "./TodosActions.module.css";
const TodosActions = ({ resetTodos, deleteTodos, completedTodosExists }) => {
  return (
    <div className={styles.todoActions}>
      <Button title="Reset Todos" onClick={resetTodos}>
        <RiRefreshLine />
      </Button>
      <Button
        title="Clear Completed"
        onClick={deleteTodos}
        disabled={!completedTodosExists}
      >
        <RiDeleteBin2Line />
      </Button>
    </div>
  );
};

export default TodosActions;
