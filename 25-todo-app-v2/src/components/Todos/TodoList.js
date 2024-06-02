import Todo from "./Todo";

const TodoList = ({ todos, deleteTodo }) => {
  return (
    <div>
      {!todos.length && <h2>No Todos</h2>}
      {todos.map((todo, index) => (
        <Todo todo={todo} key={todo.id} deleteTodo={deleteTodo} />
      ))}
    </div>
  );
};

export default TodoList;
