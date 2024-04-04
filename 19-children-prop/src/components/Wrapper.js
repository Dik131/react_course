import React from "react";
const Wrapper = (props) => {
  const style = {
    backgroundColor: props.color,
    height: "100vh",
    display: "block",
  };
  return <div style={style}>{props.children}</div>;
};
export default Wrapper;
