import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/slices/themeSlice';
import { useEffect } from 'react';

const ThemeSwitch = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className='theme-switch'>
      <input
        type='checkbox'
        id='theme-switch'
        checked={theme === 'dark'}
        onChange={() => dispatch(toggleTheme())}
      />
      <label htmlFor='theme-switch'></label>
    </div>
  );
};

export default ThemeSwitch;
