 import persons from "../data/persons";
 import './Person.css';
 const Person = (props) => {
    console.log(props);
    const {firstName, lastName, email, img} = props;
    return (
      <div className="person">
        <h1>
          {firstName} {lastName}
        </h1>
        <img src={img} alt='photo'/>
        <p>{email}</p>
      </div>
    );
  }
  
  export default Person