import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTodo } from '../../redux/slices/todoSlice';
import Button from '../UI/Button';
import styles from './TodoForm.module.css';

const TodoForm = () => {
  const [text, setText] = useState('');
  const dispatch = useDispatch();

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (text.trim()) {
      dispatch(addTodo(text.trim()));
      setText('');
    }
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
        <Button type='submit' title='Add Todo' disabled={!text.trim()}>
          Submit
        </Button>
      </form>
    </div>
  );
};
export default TodoForm;