import UserContext from "../context/UserContext";
// import UserName from "./UserName";

// function UserInfo({ user }) {
//   return <div>{user}</div>;
// }
const UserInfo = () => {
  // return <UserName>{(value) => <h1>{value}</h1>}</UserName>;
  return (
    <UserContext.Consumer>
      {(value) => <h1>{value.user}</h1>}
    </UserContext.Consumer>
  );
};

export default UserInfo;
