import { useDispatch, useSelector } from 'react-redux';
import { clearTrashcan, restoreTask } from '../../redux/slices/tasksSlice';

const Trashcan = () => {
    const dispatch = useDispatch();
    const trashedTasks = useSelector((state) => state.trashcan);

    const handleClearTrashcan = () => {
      if (
        window.confirm(
          'Are you sure you want to permanently delete all tasks in the trashcan?'
        )
      ) {
        dispatch(clearTrashcan());
      }
    };

    const TaskColumn = ({ tasks }) => (
      <div className='trashcan-column'>
        {tasks.map((task, index) => (
          <div key={index} className='trashcan-item'>
            <span>{task.text}</span>
            <button
              className='restore-button'
              onClick={() =>
                dispatch(restoreTask({ index: trashedTasks.indexOf(task) }))
              }
              title='Restore task'
            >
              <svg className='restore-icon' viewBox='0 0 24 24'>
                <path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );

    if (trashedTasks.length === 0) {
      return null;
    }

    return (
      <div className='trashcan'>
        <div className='trashcan-controls'>
          <h3 className='trashcan-header'>Trashcan</h3>
          <button
            className='delete-all-button'
            onClick={handleClearTrashcan}
            title='Empty trashcan'
          >
            <svg className='trashcan-icon' viewBox='0 0 24 24'>
              <path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' />
            </svg>
          </button>
        </div>
        <div className='trashcan-list'>
          <TaskColumn
            tasks={trashedTasks.slice(
              0,
              Math.ceil(trashedTasks.length / 2)
            )}
          />
          <TaskColumn
            tasks={trashedTasks.slice(Math.ceil(trashedTasks.length / 2))}
          />
        </div>
      </div>
    );
  };

