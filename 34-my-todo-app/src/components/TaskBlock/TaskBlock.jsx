import TaskItem from '../TaskItem/TaskItem';
import PropTypes from 'prop-types';
import styles from './TaskBlock.module.css';

const TaskBlock = ({
  title,
  tasks,
  onAdd,
  onToggle,
  onDelete,
  searchTerm,
  type,
}) => {
  const filteredTasks = tasks.filter((task) =>
    task.text.toLowerCase().includes(searchTerm ? searchTerm.toLowerCase() : '')
  );

  return (
    <div>
      <h2>{title}</h2>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.newTask;
          if (input.value.trim()) {
            onAdd(input.value);
            input.value = '';
          }
        }}
      >
        <input
          type='text'
          name='newTask'
          placeholder='Add a new task'
          className={styles.input}
        />
        <button type='submit' className={`${styles.addTaskButton}`}>
          <svg className={styles.addTaskIcon} viewBox='0 0 24 24'>
            <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
          </svg>
        </button>
      </form>
      <ul className={styles.taskList}>
        {filteredTasks.map((task, index) => (
          <TaskItem
            key={task.id || index}
            task={{
              ...task,
              id: task.id || index,
              index: index,
              type: type,
            }}
            onToggle={() => onToggle(index)}
            onDelete={() => onDelete(index)}
          />
        ))}
      </ul>
    </div>
  );
};

TaskBlock.propTypes = {
  title: PropTypes.string.isRequired,
  tasks: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  type: PropTypes.string.isRequired,
};

export default TaskBlock;
