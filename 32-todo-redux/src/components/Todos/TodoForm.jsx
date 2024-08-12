import Button from '../UI/Button';
import styles from './TodoForm.module.css';

const TodoForm = ({ text, handleTextChange, handleSubmit }) => {
  return (
    <form className={styles.TodoFormWrapper}>
      <input
        placeholder='Enter Todo'
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
      />
      <Button onClick={handleSubmit} disabled={!text.trim()}>
        Add Todo
      </Button>
    </form>
  );
};
export default TodoForm;
