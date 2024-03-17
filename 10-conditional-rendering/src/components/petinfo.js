const PetInfo = (props) => {
  const { animal, age, hasPet } = props;
  //const text = hasPet ? `my ${animal} is ${age} years old` : `I don't have a pet`;
  return (
    <div>
      {/* <h1>{text}</h1> */}
      <h1>{hasPet ? `my ${animal} is ${age} years old` : `I don't have a pet`}</h1>
    </div>
  );
};
export default PetInfo;
