import './App.css';
import PetInfo from './components/petinfo';
function App() {
  return (
    <div className="App">
      <PetInfo
        animal="cat"
        age={2}
        hasPet={true}
      />
      <PetInfo
        animal="dog"
        age={6}
        hasPet=""
      />
      <PetInfo
        animal="dog"
        age={6}
        hasPet
      />
    </div>
  );
}

export default App;
