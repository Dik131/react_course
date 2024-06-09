import { Outlet } from "react-router-dom";
import Menu from "./Menu";
const Home = () => {
  return (
    <>
      <Menu />
      <h1>Home</h1>
      <Outlet />
    </>
  );
};

export default Home;
