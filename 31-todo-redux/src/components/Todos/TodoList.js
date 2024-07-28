import { useSelector, useDispatch } from 'react-redux';
import {
  addTodo,
  toggleTodo,
  deleteTodo,
  selectTodos,
} from '../../redux/slices/todoSlice';
import Todo from './Todo';

const TodoList = () => {
  const todos = useSelector(selectTodos);
  const dispatch = useDispatch();
  return (
    <div>
      {!todos.length && <h2>No Todos</h2>}
      {todos.map((todo, index) => (
        <Todo
          key={todo.id}
          {...todo}
          deleteTodo={() => dispatch(deleteTodo(todo.id))}
          toggleTodo={() => dispatch(toggleTodo(todo.id))}
        />
      ))}
    </div>
  );
};

export default TodoList;
