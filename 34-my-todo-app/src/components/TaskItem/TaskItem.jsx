import { useDispatch } from 'react-redux';
import { toggleTask, deleteTask } from '../../redux/slices/tasksSlice';
import styles from './TaskItem.module.css';
import PropTypes from 'prop-types';

const TaskItem = ({ task }) => {
  const dispatch = useDispatch();

  const currentTask = task;

  if (!currentTask) {
    return null; // or some fallback UI
  }

  return (
    <li className={styles.taskItem}>
      <div
        className={`${styles.taskItem} ${
          currentTask.completed ? styles.completed : ''
        }`}
      >
        {currentTask.text}
        <div className={styles.taskActions}>
          <svg
            className={styles.acceptIcon}
            viewBox='0 0 24 24'
            onClick={() =>
              dispatch(toggleTask({ type: task.type, index: task.index }))
            }
          >
            <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' />
          </svg>
          <svg
            className={styles.deleteIcon}
            viewBox='0 0 24 24'
            onClick={() =>
              dispatch(deleteTask({ type: task.type, index: task.index }))
            }
          >
            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
          </svg>
        </div>
      </div>
    </li>
  );
};

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    completed: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TaskItem;
