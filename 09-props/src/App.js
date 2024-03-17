import './App.css';
import PetInfo from './components/petinfo';
function App() {
  return (
    <div className="App">
      <PetInfo
        animal="cat"
        age={2}
      />
      <PetInfo
        animal="dog"
        age={6}
      />
    </div>
  );
}

export default App;
