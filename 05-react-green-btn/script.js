const App = ({ initialButtonText, initialClassesList }) => {
  const [buttonText, setButtonText] = React.useState(initialButtonText);
  const [classesList, setClassList] = React.useState(initialClassesList);
  console.info(buttonText);
  const onButtonClick = () => {
    setButtonText(`Rng ${Math.random()}`);
    setClassList('green-btn');
  };
  return (
    <div className="app">
      <button
        className={classesList}
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
};
const container = document.getElementById('app');
const root = ReactDOM.createRoot(container);
root.render(
  <App
    initialButtonText="Click right now"
    initialClassesList=""
  />
);
