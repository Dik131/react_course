import './DayAccordion.module.css';
import { useState } from 'react';
import TaskBlock from '../TaskBlock/TaskBlock';
import PropTypes from 'prop-types';

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
        new Date()
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase()
    );

    const filteredTasks = tasks.filter((task) =>
      task.text
        .toLowerCase()
        .includes(searchTerm ? searchTerm.toLowerCase() : '')
    );

    return (
      <div>
        <button
          className={`accordion ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {day.charAt(0).toUpperCase() + day.slice(1)}
        </button>
        <div
          className='panel'
          style={{ display: isOpen ? 'block' : 'none' }}
        >
          <TaskBlock
            title=''
            tasks={filteredTasks}
            onAdd={(text) => onAdd(day, text)}
            onToggle={(index) => onToggle(day, index)}
            onDelete={(index) => onDelete(day, index)}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    );
  };

  DayAccordion.propTypes = {
    day: PropTypes.string.isRequired,
    tasks: PropTypes.array.isRequired,
    onAdd: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    searchTerm: PropTypes.string,
  };

  export default DayAccordion;