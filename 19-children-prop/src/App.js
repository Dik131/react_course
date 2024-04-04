import "./App.css";
import Wrapper from "./components/Wrapper";

function App() {
  return (
    <div className='App'>
      <Wrapper color='tomato'>
        <h2>App</h2>
        <button>Click me</button>
      </Wrapper>
      <Wrapper color='lightyellow'>
        <h2>App</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
        <input type='text' placeholder='Enter text' />
      </Wrapper>
      <Wrapper color='lightgreen'>
        <h1>Hello</h1>
        <p>World</p>
      </Wrapper>
    </div>
  );
}

export default App;
