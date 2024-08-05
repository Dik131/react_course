import { RiDeleteBin2Line, RiRefreshLine } from "react-icons/ri";
import { useDispatch, useSelector } from 'react-redux';
import Button from "../UI/Button";
import styles from "./TodosActions.module.css";
import { deleteTodo } from '../../redux/slices/todoSlice';

const TodosActions = () => {
  const dispatch = useDispatch();
  const completedTodosExists = useSelector(state => {
    // Check if state.todos is an array before using .some()
    return Array.isArray(state.todos) && state.todos.some(todo => todo.completed);
  });

  const handleResetTodos = () => {
    dispatch(deleteTodo());
  };

  const handleClearCompleted = () => {
    dispatch(deleteTodo({ completed: true }));
  };

  return (
    <div className={styles.todoActions}>
      <Button title="Reset Todos" onClick={handleResetTodos}>
        <RiRefreshLine />
      </Button>
      <Button
        title="Clear Completed"
        onClick={handleClearCompleted}
        disabled={!completedTodosExists}
      >
        <RiDeleteBin2Line />
      </Button>
    </div>
  );
};

export default TodosActions;