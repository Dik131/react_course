import { useState } from 'react';
<<<<<<< HEAD
import { useDispatch } from 'react-redux';
import { addTodo } from '../../redux/slices/todoSlice';
=======
import { useSelector, useDispatch } from 'react-redux';
import { addTodo, selectTodos } from '../../redux/slices/todoSlice';
>>>>>>> 7a0edcd (added logic for bookForm)
import Button from '../UI/Button';
import styles from './TodoForm.module.css';

const TodoForm = () => {
  const [text, setText] = useState('');
  const dispatch = useDispatch();
  const onSubmitHandler = (event) => {
    event.preventDefault();
    dispatch(addTodo(text));
    setText('');
  };
  return (
    <div className={styles.TodoFormWrapper}>
      <form onSubmit={onSubmitHandler}>
        <input
          type='text'
          placeholder='Enter Todo'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type='submit' title='Add Todo' disabled={!text}>
          Submit
        </Button>
      </form>
    </div>
  );
};
export default TodoForm;
