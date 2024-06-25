import * as actionTypes from "./actionTypes.js";

const initialState = [];

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_CURRENT_TIME:
      return [...state, action.payload];
    case actionTypes.CLEAR_ALL_CURRENT_TIMES:
      return [];
    default:
      return state;
  }
};

export default reducer;
