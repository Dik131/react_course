import { useDispatch } from 'react-redux';
import { task, onToggle, onDelete } from '../redux/slices/tasksSlice';

const TaskItem = ({ task, onToggle, onDelete }) => (
  <li>
    <span className={task.completed ? 'completed' : ''}>{task.text}</span>
    <div className='task-actions'>
      <svg className='accept-icon' viewBox='0 0 24 24' onClick={onToggle}>
        <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' />
      </svg>
      <svg className='delete-icon' viewBox='0 0 24 24' onClick={onDelete}>
        <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
      </svg>
    </div>
  </li>
);

export default TaskItem;
