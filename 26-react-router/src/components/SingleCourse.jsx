import { Link, useParams } from "react-router-dom";
import courses from "../data/courses";
const SingleCourse = () => {
  const params = useParams();
  const course = courses.find((course) => course.slug === params.slug);
  // console.info(params);
  return (
    <div className="singleCourse">
      <h1>{course.title}</h1>
      <h2>{course.description}</h2>
      <Link to=".." relative="path" className="linkBack">
        Back to courses
      </Link>
    </div>
  );
};

export default SingleCourse;
