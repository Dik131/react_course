import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [todo, setTodo] = useState(null);
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos/5")
      .then((response) => response.json())
      .then((json) => setTodo(json));
  }, []);
  console.log("App rendered");
  console.log(todo);

  //this part from https://jsonplaceholder.typicode.com/
  // fetch("https://jsonplaceholder.typicode.com/todos/1")
  //   .then((response) => response.json())
  //   .then((json) => setTodo(json));

  return <div className='App'>{todo && <h1>{todo.title}</h1>}</div>;
}

export default App;
