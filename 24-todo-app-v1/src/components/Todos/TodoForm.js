import { useState } from "react";

const TodoForm = ({ addTodo }) => {
  const [text, setText] = useState("");
  const onSubmitHandler = (event) => {
    event.preventDefault();
    addTodo(text);
    setText("");
  };
  return (
    <form onSubmit={onSubmitHandler}>
      <input
        type='text'
        placeholder='Enter Todo'
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button type='submit'>Add</button>
    </form>
  );
};
export default TodoForm;
