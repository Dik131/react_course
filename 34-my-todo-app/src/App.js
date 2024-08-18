import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from './redux/slices/darkModeSlice';
import './App.css';

useEffect(() => {
  if (tasks.isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}, [tasks.isDarkMode]);
function App() {
  return (
    <div className='App'>
      <button
        className='mode-toggle'
        onClick={() => dispatch(toggleDarkMode())}
      >
        {tasks.isDarkMode ? '🌞' : '🌙'}
      </button>
    </div>
  );
}

export default App;
