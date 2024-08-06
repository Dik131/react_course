import { useSelector } from "react-redux";
import TodoItem from "./TodoItem";

const TodoList = () => {
  const todos = useSelector((state) => state.todos);
  console.log("Todos from Redux:", todos);

  if (todos?.length === 0) {
    return <p>No todos yet. Add some tasks!</p>;
  }

  return (
    <div>
      {todos?.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
};
export default TodoList;
