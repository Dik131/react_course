import { openDB } from 'idb';

export const createIndexedDBMiddleware = (dbName, storeName) => {
  let db;

  const initDB = async () => {
    db = await openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      },
    });
  };

  initDB();

  return (store) => (next) => async (action) => {
    const result = next(action);
    const state = store.getState();

    if (action.type.startsWith('tasks/')) {
      await db.put(storeName, state.tasks);
    }

    return result;
  };
};