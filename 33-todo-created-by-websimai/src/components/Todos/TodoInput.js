import React from "react";
import { useDispatch } from "react-redux";
import { addTodo } from "../../redux/slices/todoSlice";
import styles from "./TodoInput.module.css";

const TodoInput = () => {
  const [input, setInput] = React.useState('');
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      dispatch(addTodo(input.trim()));
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <input
        type='text'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='Add a new todo'
        className={styles.input}
      />
      <button type='submit' className={styles.button}>Add</button>
    </form>
  );
};

export default TodoInput;

