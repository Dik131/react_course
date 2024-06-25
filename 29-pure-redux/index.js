import store from "./redux/store.js";
import { addCurrentTime, clearAllTimes } from "./redux/actionCreators.js";

//the first realiztion of pure redux
// const unsubscribe = store.subscribe(() => {
//   console.log(`store changed ${store.getState()}`);
// });

// console.log(store.getState());

// store.dispatch({ type: 'ADD_CURRENT_TIME', payload: Date.now() });

// console.log(store.getState());

// unsubscribe();
// store.dispatch({ type: 'ADD_CURRENT_TIME', payload: '20:18:00' });
// store.dispatch({ type: 'ADD_CURRENT_TIME', payload: '21:18:00' });

// console.log(store.getState());

// store.dispatch({ type: 'CLEAR_ALL_CURRENT_TIMES' });

// console.log(store.getState());

//the second realization of pure redux
const addTimeBtn = document.getElementById("addTime");
addTimeBtn.addEventListener("click", () => {
  store.dispatch(addCurrentTime());
});
const timesList = document.getElementById("timesList");

store.subscribe(() => {
  const times = store.getState();
  timesList.innerHTML = "";
  //   while (timesList.firstChild) {
  //     timesList.removeChild(timesList.firstChild);
  //   }
  times.forEach((time) => {
    const li = document.createElement("li");
    li.innerText = time;
    timesList.appendChild(li);
  });
});

const clearTimesBtn = document.getElementById("clearTimes");
clearTimesBtn.addEventListener("click", () => {
  store.dispatch(clearAllTimes());
});
