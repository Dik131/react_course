import styles from './DayAccordion.module.css';
import { useState } from 'react';
import TaskBlock from '../TaskBlock/TaskBlock';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

const DayAccordion = ({
  day,
  tasks,
  onAdd,
  onToggle,
  onDelete,
  searchTerm,
}) => {
  const [isOpen, setIsOpen] = useState(
    day ===
      new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  );

  const theme = useSelector((state) => state.theme);

  return (
    <div
      className={`${styles.dayAccordion} ${
        theme === 'dark' ? styles.darkTheme : ''
      }`}
    >
      <button
        className={`${styles.accordion} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {day.charAt(0).toUpperCase() + day.slice(1)}
      </button>
      <div
        className={styles.panel}
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <TaskBlock
          title=''
          tasks={tasks || []}
          onAdd={(text) => onAdd(day, text)}
          onToggle={(index) => onToggle(day, index)}
          onDelete={(index) => onDelete(day, index)}
          searchTerm={searchTerm}
          type={`byDay-${day}`}
        />
      </div>
    </div>
  );
};

DayAccordion.propTypes = {
  day: PropTypes.string.isRequired,
  tasks: PropTypes.array,
  onAdd: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
};

export default DayAccordion;
