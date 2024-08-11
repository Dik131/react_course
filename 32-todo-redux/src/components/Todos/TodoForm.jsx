import { useState } from 'react';
import Button from '../UI/Button';
import styles from './TodoForm.module.css';

const TodoForm = ({ text, handleTextChange, handleSubmit }) => {
  return (
    <div className={styles.TodoFormWrapper}>
      <input
        placeholder='Enter Todo'
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
      />
      <button onClick={handleSubmit} disabled={!text.trim()}>
        Add Todo
      </button>
    </div>
  );
};
export default TodoForm;
