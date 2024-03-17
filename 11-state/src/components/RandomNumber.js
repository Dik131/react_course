import { useState } from 'react';
import generateRandomNumber from '../utilities/RandomNumberGenerator';

const RandomNumber = ({ maxNumber }) => {
  console.log('%cRandomNumber', 'font-size: 1.1rem; color: #00075');
  const [randomNumber, setRandomNumber] = useState(generateRandomNumber(maxNumber));
  return (
    <div>
      <div className="spacer"></div>
      <h1>{randomNumber}</h1>
      <div className="spacer"></div>
      <button onClick={() => setRandomNumber(generateRandomNumber(maxNumber))}>Get number</button>
    </div>
  );
};
export default RandomNumber;
