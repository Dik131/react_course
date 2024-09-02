import { createSlice } from '@reduxjs/toolkit';

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
        trashcan: [],
        theme: 'light',
    },
    reducers: {
        addTask: (state, action) => {
            const { type, text } = action.payload;
            state[type].push({ text, completed: false });
        },
        toggleTask: (state, action) => {
            const { type, index } = action.payload;
            state[type][index].completed = !state[type][index].completed;
        },
        deleteTask: (state, action) => {
            const { type, index } = action.payload;
            const deletedTask = state[type].splice(index, 1)[0];
            state.trashcan.push({ ...deletedTask, type, index });
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
