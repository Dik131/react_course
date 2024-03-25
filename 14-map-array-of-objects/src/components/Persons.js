import persons from "../data/persons"
import Person from "./Person";
import './Persons.css'

const Persons = () => {
    return <div className="card">
              {persons.map((person) => {
        //const {id, firstName, lastName, email, img} = person;
        //return <Person key={id} firstName={firstName} lastName={lastName} email={email} img={img}/>;
        return <Person key={person.id} {...person} />;
      })}
    </div>
}
export default Persons