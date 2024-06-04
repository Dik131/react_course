import { useState } from "react";
import styles from "./TodoForm.module.css";

const TodoForm = ({ addTodo }) => {
  const [text, setText] = useState("");
  const onSubmitHandler = (event) => {
    event.preventDefault();
    addTodo(text);
    setText("");
  };
  return (
    <div className={styles.TodoFormWrapper}>
      <form onSubmit={onSubmitHandler}>
        <input
          placeholder='Enter Todo'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type='submit' disabled={!text}>
          Add
        </button>
      </form>
    </div>
  );
};
export default TodoForm;
