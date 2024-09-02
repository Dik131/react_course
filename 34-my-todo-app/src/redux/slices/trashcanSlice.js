import { createSlice } from '@reduxjs/toolkit';

const trashcanSlice = createSlice({
  name: 'trashcan',
  initialState: [],
  reducers: {
    restoreTask: (state, action) => {
      const { index } = action.payload;
      const restoredTask = state.splice(index, 1)[0];
      return restoredTask;
    },
    clearTrashcan: () => {
      return [];
    },
  },
});

export const { restoreTask, clearTrashcan } = trashcanSlice.actions;
export default trashcanSlice.reducer;
