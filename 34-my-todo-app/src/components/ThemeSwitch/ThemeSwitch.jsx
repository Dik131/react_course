import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/slices/toggleThemeSlice';
import { useEffect } from 'react';
import styles from './ThemeSwitch.module.css';

const ThemeSwitch = () => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme);

    useEffect(() => {
      document.body.className = theme;
    }, [theme]);

    return (
        <div className={styles['theme-switch']}>
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