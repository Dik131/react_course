import { createSlice } from '@reduxjs/toolkit';
import { get, set } from 'idb-keyval';

// Middleware to save state to IndexedDB after each action
export const saveStateMiddleware = store => next => action => {
  const result = next(action);
  const state = store.getState();
  set('tasks', state.tasks);
  return result;
};

export const loadStateMiddleware = store => next => action => {
  const result = next(action);
  const state = store.getState();
  get('tasks', state.tasks);
  return result;
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState: {
        everyday: [],
        weekly: [],
        todoList: [],
        byDay: {
            sunday: [],
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
        },
        searchTerm: '',
        trashcan: [], // Make sure this is included
        theme: 'light',
    },
    middleware: [saveStateMiddleware, loadStateMiddleware],
    reducers: {
        addTodo: (state, action) => {
            state.push({
              id: Date.now(),
              text: action.payload,
              completed: false,
            });
            saveStateMiddleware(state);
          },
          toggleTodo: (state, action) => {
            const todo = state.find((todo) => todo.id === action.payload);
            if (todo) {
              todo.completed = !todo.completed;
              saveStateMiddleware(state);
            }
          },
          deleteTodo: (state, action) => {
            const newState = state.filter((todo) => todo.id !== action.payload);
            saveStateMiddleware(newState);
            return newState;
          },
        addDayTask: (state, action) => {
            const { day, text } = action.payload;
            state.byDay[day].push({ text, completed: false });
        },
        toggleDayTask: (state, action) => {
            const { day, index } = action.payload;
            state.byDay[day][index].completed = !state.byDay[day][index].completed;
        },
        deleteDayTask: (state, action) => {
            const { day, index } = action.payload;
            const deletedTask = state.byDay[day].splice(index, 1)[0];
            state.trashcan.push({ ...deletedTask, type: 'byDay', day, index });
        },
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
        },
        loadTasks: (state, action) => {
            return { ...state, ...action.payload };
        },
        restoreTask: (state, action) => {
            const { index } = action.payload;
            const restoredTask = state.trashcan.splice(index, 1)[0];
            if (restoredTask.type === 'byDay') {
                state.byDay[restoredTask.day].splice(restoredTask.index, 0, restoredTask);
            } else {
                state[restoredTask.type].splice(restoredTask.index, 0, restoredTask);
            }
        },
        clearTrashcan: (state) => {
            state.trashcan = [];
        },
        uncheckEverydayTasks: (state) => {
            state.everyday.forEach((task) => (task.completed = false));
        },
        uncheckWeeklyTasksAndWeekAccordion: (state) => {
            state.weekly.forEach((task) => (task.completed = false));
            Object.keys(state.byDay).forEach((day) =>
                state.byDay[day].forEach((task) => (task.completed = false))
            );
        },
    },
});

export const {
    addTask,
    toggleTask,
    deleteTask,
    addDayTask,
    toggleDayTask,
    deleteDayTask,
    setSearchTerm,
    loadTasks,
    restoreTask,
    clearTrashcan,
    uncheckEverydayTasks,
    uncheckWeeklyTasksAndWeekAccordion,
    toggleTheme,
} = tasksSlice.actions;

export default tasksSlice.reducer;
