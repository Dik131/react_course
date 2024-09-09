import { useDispatch, useSelector } from 'react-redux';
import { clearTrashcan, restoreTask } from '../../redux/slices/tasksSlice';
import PropTypes from 'prop-types';
import styles from './Trashcan.module.css';

const Trashcan = () => {
  const dispatch = useDispatch();
  const trashedTasks = useSelector((state) => state.tasks.trashcan || []);
  const theme = useSelector((state) => state.theme);

  const handleClearTrashcan = () => {
    if (
      window.confirm(
        'Are you sure you want to permanently delete all tasks in the trashcan?'
      )
    ) {
      dispatch(clearTrashcan());
    }
  };

  const TaskColumn = ({ tasks = [] }) => (
    <div
      className={`${styles.trashcanColumn} ${
        theme === 'dark' ? styles : ''
      }`}
    >
      {tasks.map((task, index) => (
        <div
          key={index}
          className={styles.trashcanItem}
        >
          <span>{task.text}</span>
          <button
            className={styles.restoreButton}
            onClick={() =>
              dispatch(restoreTask({ index: trashedTasks.indexOf(task) }))
            }
            title='Restore task'
          >
            <svg className={styles.restoreIcon} viewBox='0 0 24 24'>
              <path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  TaskColumn.propTypes = {
    tasks: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
      })
    ).isRequired,
  };

  if (!trashedTasks || trashedTasks.length === 0) {
    return (
      <div
        className={styles.emptyTrashcan}
      >
        Trashcan is empty
      </div>
    );
  }

  return (
    <div
      className={`${styles.trashcan} ${theme === 'dark' ? styles.darkTheme : ''}`}
    >
      <div className={styles.trashcanControls}>
        <h3
          className={styles.trashcanHeader}
        >
          Trashcan
        </h3>
        <button
          className={styles.deleteAllButton}
          onClick={handleClearTrashcan}
          title='Empty trashcan'
        >
          <svg
            className={styles.trashcanIcon}
            viewBox='0 0 24 24'
          >
            <path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' />
          </svg>
        </button>
      </div>
      <div className={styles.trashcanList}>
        <TaskColumn
          tasks={trashedTasks.slice(0, Math.ceil(trashedTasks.length / 2))}
        />
        <TaskColumn
          tasks={trashedTasks.slice(Math.ceil(trashedTasks.length / 2))}
        />
      </div>
    </div>
  );
};

export default Trashcan;
