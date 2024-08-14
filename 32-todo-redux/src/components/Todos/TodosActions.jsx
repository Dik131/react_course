import { RiDeleteBin2Line, RiRefreshLine } from 'react-icons/ri';
import { useSelector, useDispatch } from 'react-redux';
import { resetTodos, deleteCompletedTodos } from '../../redux/slices/todoSlice';
import Button from '../UI/Button';
import styles from './TodosActions.module.css';

const TodosActions = () => {
  const dispatch = useDispatch();
  const todos = useSelector((state) => state.todos.todos);

  if (!todos || todos.length === 0) {
    return null;
  }

  const completedTodosExists = todos.some((todo) => todo.completed);

  const handleResetTodos = () => {
    dispatch(resetTodos());
  };

  const handleDeleteCompletedTodos = () => {
    dispatch(deleteCompletedTodos());
  };

  return (
    <div className={styles.todoActions}>
      <Button title='Reset Todos' onClick={handleResetTodos}>
        <RiRefreshLine />
      </Button>
      <Button
        title='Clear Completed'
        onClick={handleDeleteCompletedTodos}
        disabled={!completedTodosExists}
      >
        <RiDeleteBin2Line />
      </Button>
    </div>
  );
};

export default TodosActions;
