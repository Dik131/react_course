import { useState } from "react";
import Button from "../UI/Button";
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
          placeholder="Enter Todo"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" title="Add Todo" disabled={!text}>
          Submit
        </Button>
      </form>
    </div>
  );
};
export default TodoForm;
