import { Link } from "react-router-dom";
import courses from "../data/courses";
function Courses() {
  return (
    <>
      <h1>Courses</h1>
      {courses.map((course) => (
        <Link to={course.slug} key={course.id} className="innerLink">
          {course.title}
          <br />
        </Link>
      ))}
    </>
  );
}

export default Courses;
