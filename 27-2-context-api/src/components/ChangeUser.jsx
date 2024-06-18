import { useContext } from "react";
import UserContext from "../context/UserContext";

function ChangeUser() {
  const { userName, changeUserName: setUser } = useContext(UserContext);

  return (
    <button onClick={() => setUser(userName === "Dude" ? "Mate" : "Dude")}>
      Change User
    </button>
  );
}

export default ChangeUser;
