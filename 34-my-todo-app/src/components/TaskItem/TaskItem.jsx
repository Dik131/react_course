import { useDispatch, useSelector } from 'react-redux';
import { toggleTask, deleteTask } from '../../redux/slices/tasksSlice';
import styles from './TaskItem.module.css';
import PropTypes from 'prop-types';

const TaskItem = ({ task }) => {
    const dispatch = useDispatch();
    const tasks = useSelector((state) => state.tasks.everyday); // Adjust based on your state structure

    const currentTask = tasks.find(t => t.id === task.id);

    return (
        <li>
            <div className={`${styles.taskItem} ${currentTask.completed ? styles.completed : ''}`}>
                <div className='task-actions'>
                    <svg className='accept-icon' viewBox='0 0 24 24' onClick={() => dispatch(toggleTask(currentTask.id))}>
                        <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' />
                    </svg>
                    <svg className='delete-icon' viewBox='0 0 24 24' onClick={() => dispatch(deleteTask(currentTask.id))}>
                        <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
                    </svg>
                </div>
            </div>
        </li>
    );
};

TaskItem.propTypes = {
    task: PropTypes.shape({
        id: PropTypes.number.isRequired,
        completed: PropTypes.bool.isRequired,
    }).isRequired,
};

export default TaskItem;