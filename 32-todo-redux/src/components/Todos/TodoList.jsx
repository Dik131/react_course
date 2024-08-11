import Todo from './Todo';

const TodoList = ({ todos, deleteTodo, completeTodo }) => {
  return (
    <div>
      {!todos.length && <h2>No Todos</h2>}
      {todos.map((todo, index) => (
        <Todo
          {...todo}
          key={todo.id}
          completeTodo={completeTodo}
          deleteTodo={deleteTodo}
        />
      ))}
    </div>
  );
};

export default TodoList;
