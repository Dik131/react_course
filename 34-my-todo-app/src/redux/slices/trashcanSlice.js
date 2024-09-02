import { createSlice } from '@reduxjs/toolkit';

const trashcanSlice = createSlice({
  name: 'trashcan',
  initialState: [],
  reducers: {
    clearTrashcan: (state) => {
      return [];
    },
    restoreTask: (state, action) => {
      const { index } = action.payload;
      const restoredTask = state.splice(index, 1)[0];
      // Logic to restore the task to its original place
    },
  },
});

export const { clearTrashcan, restoreTask } = trashcanSlice.actions;
export default trashcanSlice.reducer;
