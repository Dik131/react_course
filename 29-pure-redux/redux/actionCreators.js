import getCurrentTime from "../utils/getCurrentTime.js";
import * as actionTypes from "./actionTypes.js";

export const addCurrentTime = () => {
  return {
    type: actionTypes.ADD_CURRENT_TIME,
    payload: getCurrentTime(),
  };
};

export const clearAllTimes = () => {
  return {
    type: actionTypes.CLEAR_ALL_CURRENT_TIMES,
  };
};
