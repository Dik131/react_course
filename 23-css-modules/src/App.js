import Info from "./components/Info";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Info />
      <div className="info">
        <h1>Hello from App.JS</h1>
        <h2>Color from info module</h2>
        <button className="btn">App's button</button>
      </div>
    </div>
  );
}

export default App;
