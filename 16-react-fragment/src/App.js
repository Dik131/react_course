import "./App.css";
import Card from "./Components/Card";

function App() {
  return (
    <div className='App'>
      <div className='cards'>
        <Card title='Card 1' desc='Description 1' />
        <Card title='Card 2' desc='Description 2' />
        <Card title='Card 3' desc='Description 3' />
      </div>
    </div>
  );
}

export default App;
