import { Link, useNavigate, useParams } from "react-router-dom";
import courses from "../data/courses";
// import NotFound from "./NotFound";
import { useEffect } from "react";
const SingleCourse = () => {
  const params = useParams();
  const navigate = useNavigate();
  const course = courses.find((course) => course.slug === params.slug);
  // a little harder way to show 404 page
  useEffect(() => {
    if (!course) {
      navigate("..", { relative: "path" });
    }
  }, [course, navigate]);

  // the simple way to show 404 page
  // if (!courses.find((course) => course.slug === params.slug)) {
  //   return (
  //     <div className="singleCourse">
  //       <NotFound />
  //       <Link to=".." relative="path" className="linkBack">
  //         Choose a course
  //       </Link>
  //     </div>
  //   );
  // }
  // console.info(params);
  return (
    <div className="singleCourse">
      <h1>{course?.title}</h1>
      <h2>{course?.description}</h2>
      <Link to=".." relative="path" className="linkBack">
        Back to courses
      </Link>
    </div>
  );
};

export default SingleCourse;
