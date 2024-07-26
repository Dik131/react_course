import Todo from "./Todo";

const TodoList = ({ todos, deleteTodo, toggleTodo }) => {
  return (
    <div>
      {!todos.length && <h2>No Todos</h2>}
      {todos.map((todo, index) => (
        <Todo
          todo={todo}
          key={todo.id}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
        />
      ))}
    </div>
  );
};

export default TodoList;
