import "./App.css";

const MyComponent = () => {
  return (
    <div>
      <h1>This is a reusable component</h1>
      <button>Like!</button>
    </div>
  );
};
function App() {
  return (
    <div className="App">
      <MyComponent />
    </div>
  );
}

export default App;
