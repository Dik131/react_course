import UserContext from "../context/UserContext";
// function UserInfo({ user }) {
//   return <div>{user}</div>;
// }
const UserInfo = () => {
  return (
    <UserContext.Consumer>
      {(value) => <h1>{value.user}</h1>}
    </UserContext.Consumer>
  );
};

export default UserInfo;
