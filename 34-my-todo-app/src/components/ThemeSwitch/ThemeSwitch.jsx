import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/slices/toggleThemeSlice';
import styles from './ThemeSwitch.module.css';

const ThemeSwitch = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);

  return (
    <div className={styles.themeSwitch}>
      <input
        type='checkbox'
        id='theme-switch'
        className={styles.themeSwitchInput}
        checked={theme === 'dark'}
        onChange={() => dispatch(toggleTheme())}
      />
      <label htmlFor='theme-switch' className={styles.themeSwitchLabel}></label>
    </div>
  );
};

export default ThemeSwitch;
