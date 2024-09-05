import './TaskBlock.module.css';
import { useState } from 'react';
import TaskItem from '../TaskItem/TaskItem';
import PropTypes from 'prop-types';

const TaskBlock = ({
    title,
    tasks,
    onAdd,
    onToggle,
    onDelete,
    searchTerm,
  }) => {
    const [newTask, setNewTask] = useState('');

    const filteredTasks = tasks.filter((task) =>
      task.text
        .toLowerCase()
        .includes(searchTerm ? searchTerm.toLowerCase() : '')
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
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='Add a new task'
          />
          <button
            type='submit'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg className='add-task-icon' viewBox='0 0 24 24'>
              <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
            </svg>
          </button>
        </form>
        <ul>
          {filteredTasks.map((task, index) => (
            <TaskItem
              key={index}
              task={task}
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
};

export default TaskBlock;