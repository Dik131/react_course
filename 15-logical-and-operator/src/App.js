import { useState } from "react";
import "./App.css";
import Counter from "./components/Counter";
import Button from "./components/Button";
// import IncrementCount from "./components/IncrementCount";

const App = () => {
  const [count, setCount] = useState(0);
  const IncrementCount = () => {
    setCount(count + 1);
  };
  const resetCount = () => {
    setCount(0);
  };

  const buttonStyle = { backgroundColor: "lightblue" };

  return (
    <div className='App'>
      <div className='spacer'></div>
      <Counter count={count} />
      <div className='spacer'></div>
      <div className='Buttons'>
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
        <Button onClick={IncrementCount} />
      </div>
      {!!count && (
        <button style={buttonStyle} onClick={resetCount}>
          Reset
        </button>
      )}
    </div>
  );
};
//!!count is equal to caunt > 0
export default App;
