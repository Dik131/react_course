import { useState } from "react";
import "./App.css";
import Counter from "./components/Counter";
import Button from "./components/Button";
// import IncrementCount from "./components/IncrementCount";

function App() {
  const [count, setCount] = useState(0);
  const IncrementCount = () => {
    setCount(count + 1);
  };
  return (
    <div className="App">
      <div className="spacer"></div>
      <Counter count={count} />
      <div className="spacer"></div>
      <div className="Buttons">
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
      </div>
    </div>
  );
}

export default App;
