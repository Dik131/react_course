import { RiDeleteBin2Line, RiRefreshLine } from "react-icons/ri";
import Button from "../UI/Button";
import styles from "./TodosActions.module.css";
const TodosActions = () => {
  return (
    <div className={styles.todoActions}>
      <Button title='Reset Todos'>
        <RiRefreshLine />
      </Button>
      <Button title='Clear Completed'>
        <RiDeleteBin2Line />
      </Button>
    </div>
  );
};

export default TodosActions;
