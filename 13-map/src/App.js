import { useState } from 'react';
import './App.css';
import Counter from './components/Counter';
import Button from './components/Button';

const texts = ['Click me right now', 'Click me twice', 'Click me here', 'Click me again'];

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
        {texts.map((text, index) => {
          return (
            <Button
              onClick={IncrementCount}
              text={text}
              key={index}
            />
          );
        })}
        {/* key is a unique identifier for property map (it could be index or text itself*/}
        {/* <Button onClick={IncrementCount} text={texts[0]}/>
        <Button onClick={IncrementCount} text={texts[1]}/>
        <Button onClick={IncrementCount} text={texts[2]}/>
        <Button onClick={IncrementCount} text={texts[3]}/> */}
      </div>
    </div>
  );
}

export default App;
