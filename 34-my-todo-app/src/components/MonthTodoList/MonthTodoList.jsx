import { useSelector, useDispatch } from 'react-redux';
import { addTask, toggleTask, deleteTask } from '../../redux/slices/tasksSlice';
import TaskBlock from '../TaskBlock/TaskBlock';
import styles from './MonthTodoList.module.css';

const MonthTodoList = () => {
  const dispatch = useDispatch();
  const monthTasks = useSelector((state) => state.tasks.monthTasks || []);
  const searchTerm = useSelector((state) => state.tasks.searchTerm);

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <div className={styles.monthTodoList}>
      <TaskBlock
        title={`${currentMonth}'s tasks`}
        tasks={monthTasks}
        onAdd={(text) => dispatch(addTask({ type: 'monthTasks', text }))}
        onToggle={(index) =>
          dispatch(toggleTask({ type: 'monthTasks', index }))
        }
        onDelete={(index) =>
          dispatch(deleteTask({ type: 'monthTasks', index }))
        }
        searchTerm={searchTerm}
        type='monthTasks'
      />
    </div>
  );
};

export default MonthTodoList;
