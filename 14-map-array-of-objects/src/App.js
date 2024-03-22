import './App.css';
import persons from './data/persons';
import Person from './components/Person';

function App() {
  return (
    <div className="App">
      {persons.map((person) => {
        //const {id, firstName, lastName, email, img} = person;
        //return <Person key={id} firstName={firstName} lastName={lastName} email={email} img={img}/>;
        return <Person key={person.id} {...person} />;
      })}
    </div>
  );
}

export default App;
