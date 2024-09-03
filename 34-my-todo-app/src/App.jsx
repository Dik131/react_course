import './App.css'
import ThemeSwitch from './components/ThemeSwitch/ThemeSwitch'
import Trashcan from './components/Trashcan/Trashcan'
import PercentageCounter from './components/PercentageCounter/PercentageCounter'
import DayAccordion from './components/DayAccordion/DayAccordion'
import TaskBlock from './components/TaskBlock/TaskBlock'

function App() {
  const dispatch = useDispatch();
        const { everyday, weekly, todoList, byDay, searchTerm, theme } =
          useSelector((state) => state);

        useEffect(() => {
          const loadTasksFromIndexedDB = async () => {
            try {
              const storedTasks = await get('tasks');
              if (storedTasks) {
                dispatch(loadTasks(storedTasks));
              }
            } catch (error) {
              console.error('Error loading tasks from IndexedDB:', error);
            }
          };

          loadTasksFromIndexedDB();
        }, [dispatch]);

        useEffect(() => {
          const midnightCheck = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
              dispatch(uncheckEverydayTasks());
              if (now.getDay() === 0) {
                dispatch(uncheckWeeklyTasksAndWeekAccordion());
              }
            }
          };

          midnightCheck();
          const intervalId = setInterval(midnightCheck, 60000);
          return () => clearInterval(intervalId);
        }, [dispatch]);

        const weekDays = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        const currentDay = new Date()
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();

  return (
    <>
      <h1>Weeky</h1>
      <ThemeSwitch />
      <PercentageCounter everyday={everyday} currentDayTasks={byDay[currentDay]} />
      <div className='search-bar'>
              <input
                type='text'
                placeholder='Search tasks...'
                value={searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              />
            </div>
            <div className='columns'>
              <div className='column'>
                <TaskBlock
                  title='Everyday Tasks'
                  tasks={everyday}
                  onAdd={(text) =>
                    dispatch(addTask({ type: 'everyday', text }))
                  }
                  onToggle={(index) =>
                    dispatch(toggleTask({ type: 'everyday', index }))
                  }
                  onDelete={(index) =>
                    dispatch(deleteTask({ type: 'everyday', index }))
                  }
                  searchTerm={searchTerm}
                />
                {weekDays.map((day) => (
                  <DayAccordion
                    key={day}
                    day={day}
                    tasks={byDay[day]}
                    onAdd={(day, text) => dispatch(addDayTask({ day, text }))}
                    onToggle={(day, index) =>
                      dispatch(toggleDayTask({ day, index }))
                    }
                    onDelete={(day, index) =>
                      dispatch(deleteDayTask({ day, index }))
                    }
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
              <div className='column'>
                <TaskBlock
                  title='Weekly Tasks'
                  tasks={weekly}
                  onAdd={(text) => dispatch(addTask({ type: 'weekly', text }))}
                  onToggle={(index) =>
                    dispatch(toggleTask({ type: 'weekly', index }))
                  }
                  onDelete={(index) =>
                    dispatch(deleteTask({ type: 'weekly', index }))
                  }
                  searchTerm={searchTerm}
                />
                <TaskBlock
                  title='Todo List'
                  tasks={todoList}
                  onAdd={(text) =>
                    dispatch(addTask({ type: 'todoList', text }))
                  }
                  onToggle={(index) =>
                    dispatch(toggleTask({ type: 'todoList', index }))
                  }
                  onDelete={(index) =>
                    dispatch(deleteTask({ type: 'todoList', index }))
                  }
                  searchTerm={searchTerm}
                />
              </div>
            </div>  
      <Trashcan />
    </>
  )
}

export default App
