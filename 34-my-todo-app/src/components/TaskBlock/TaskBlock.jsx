import { useState } from 'react';
import TaskItem from '../TaskItem/TaskItem';
import PropTypes from 'prop-types';
import styles from './TaskBlock.module.css';

const TaskBlock = ({ title, tasks, onAdd, onToggle, onDelete, searchTerm }) => {
  const [newTask, setNewTask] = useState('');

  const filteredTasks = tasks.filter((task) =>
    task.text.toLowerCase().includes(searchTerm ? searchTerm.toLowerCase() : '')
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAdd(newTask);
      setNewTask('');
    }
  };

  return (
    <div>
      <h2>{title}</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type='text'
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder='Add a new task'
          className={styles.input}
        />
        <button type='submit' className={styles.addTaskButton}>
          <svg className={styles.addTaskIcon} viewBox='0 0 24 24'>
            <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
          </svg>
        </button>
      </form>
      <ul className={styles.taskList}>
        {filteredTasks.map((task, index) => (
          <li key={index} className={styles.taskItem}>
            <TaskItem
              task={{
                ...task,
                id: index,
                index: index,
                type: title.toLowerCase().replace(' tasks', ''),
              }}
              onToggle={() => onToggle(index)}
              onDelete={() => onDelete(index)}
            />
          </li>
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
};

export default TaskBlock;
