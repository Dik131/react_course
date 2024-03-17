const PetInfo = (props) => {
  const { animal, age } = props;
  console.log(props);
  return (
    <div>
      <h1>
        my {animal} is {age} years <b>old</b>
      </h1>
    </div>
  );
};
export default PetInfo;
