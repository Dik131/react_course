import React from "react"; //isn't needed in modern versions of React.JS
import "./Card.css";
const Card = (props) => {
  return (
    <>
      {/*<></> is same as <React.Fragment> </React.Fragment> */}
      <div className='card'>
        <h1>{props.title}</h1>
        <h3>{props.desc}</h3>
        <button>Click Here</button>
      </div>
    </>
  );
};
export default Card;
