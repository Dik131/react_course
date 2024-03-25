 //import persons from "../data/persons";
 import './Person.css';
 const Person = (props) => {
    console.log(props);
    const {firstName, lastName, email, img} = props;
    return (
      <div>
      <div className='spacer'></div>
      <div className="person">
        <h1>
          {firstName} {lastName}
        </h1>
        <img src={img} alt='Profile_image'/>
        <p>{email}</p>
      </div>
      </div>
    );
  }
  
  export default Person