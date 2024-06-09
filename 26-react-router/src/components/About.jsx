import { Link } from "react-router-dom";
export default function About() {
  return (
    <>
      <h1>About</h1>
      <Link to="/" className="innerLink">
        Go Home
      </Link>
    </>
  );
}
