import {
  RiTodoFill,
  RiDeleteBin2Line,
  RiCheckDoubleFill,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTodo, toggleTodo } from '../../redux/slices/todoSlice';
import styles from './Todo.module.css';

const Todo = () => {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  const todos = useSelector((state) => state.todos.todos);
  const dispatch = useDispatch();
=======
=======
>>>>>>> 8468324 (moved todo state from app.js to slice)
  const todo = useSelector((state) => state.todos.todos[0]);
  const dispatch = useDispatch();
  const deleteTodo = (id) => dispatch(deleteTodo(id));
  const toggleTodo = (id) => dispatch(toggleTodo(id));
<<<<<<< HEAD
>>>>>>> 8468324 (moved todo state from app.js to slice)
=======
  const todos = useSelector((state) => state.todos.todos);
  const dispatch = useDispatch();
>>>>>>> a77f308 (the last commit for today)
=======
>>>>>>> 8468324 (moved todo state from app.js to slice)
=======
  const todos = useSelector((state) => state.todos.todos);
  const dispatch = useDispatch();
>>>>>>> a77f308 (the last commit for today)
  return (
    <div className={styles.todo}>
      <RiTodoFill className={styles.todoIcon} />
      <div>{todos.text}</div>
      <RiDeleteBin2Line
        className={styles.deleteIcon}
        onClick={() => deleteTodo(dispatch(todos.id))}
      />
      <RiCheckDoubleFill
        className={styles.checkIcon}
        onClick={() => toggleTodo(dispatch(todos.id))}
      />
    </div>
  );
};

export default Todo;
