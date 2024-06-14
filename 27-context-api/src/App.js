import { useState } from "react";
import UserContext from "./context/UserContext";
import "./App.css";
import User from "./components/User";

function App() {
  const [user, setUser] = useState("Mate");
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div className='App'>
        {/* <User user={user} setUser={setUser} /> */}
        <User />
      </div>
    </UserContext.Provider>
  );
}

export default App;
