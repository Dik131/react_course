import { Link, useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
import { useState, useEffect } from "react";
import courses from "../data/courses";

const SORT_KEYS = ["description", "slug", "id"];
let sortCourses = (courses, key) => {
  const sortedCourses = [...courses];
  if (!key || !SORT_KEYS.includes(key)) {
    return sortedCourses;
  }
  sortedCourses.sort((a, b) => (a[key] > b[key] ? 1 : -1));
  return sortedCourses;
};

const Courses = () => {
  const location = useLocation();
  const query = queryString.parse(location.search);
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState(query.sort || "title");
  const [sortedCourses, setSortedCourses] = useState(
    sortCourses(courses, sortKey)
  );

  useEffect(() => {
    if (!SORT_KEYS.includes(sortKey)) {
      navigate(".");
      setSortKey();
      setSortedCourses([...courses]);
    }
  }, [sortKey, navigate]);

  return (
    <>
      <h1>{sortKey ? `Sorted by ${sortKey}` : "All courses"}</h1>
      {sortedCourses.map((course) => (
        <Link to={course.slug} key={course.id} className="innerLink">
          {course.title}
          <br />
        </Link>
      ))}
    </>
  );
};

export default Courses;
