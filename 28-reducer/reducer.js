const initialState = [];

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NAME':
      return [...state, action.payload];
    case 'DELETE_NAME':
      return state.filter((name) => name !== action.payload);
    case 'RESET_NAMES':
      return [];
    default:
      return state;
  }
  //   if (action.type === 'ADD_NAME') {
  //     return [...state, action.payload];
  //   }

  //   if (action.type === 'DELETE_NAME') {
  //     return state.filter((name) => name !== action.payload);
  //   }
  //   if (action.type === 'RESET_NAMES') {
  //     return [];
  //   }
  //   return state;
};

let newState = reducer(initialState, { type: 'ADD_NAME', payload: 'test_1' });
console.log(newState);

newState = reducer(newState, { type: 'ADD_NAME', payload: 'test_2' });
console.log(newState);

newState = reducer(newState, { type: 'DELETE_NAME', payload: 'test_1' });
console.log(newState);

newState = reducer(newState, { type: 'RESET_NAMES' });
console.log(newState);

newState = reducer(initialState, { type: 'ADD_NAME', payload: 'test_3' });
console.log(newState);

newState = reducer(newState, { type: 'ADD_NAME', payload: 'test_4' });
console.log(newState);
