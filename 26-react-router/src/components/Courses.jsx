import { Link, useLocation } from "react-router-dom";
import queryString from "query-string";
import { useState } from "react";
import courses from "../data/courses";

const sortCourses = (courses, key) => {
  const sortedCourses = [...courses];
  sortedCourses.sort((a, b) => (a[key] > b[key] ? 1 : -1));
  return sortedCourses;
};

const Courses = () => {
  const location = useLocation();
  const query = queryString.parse(location.search);
  const [sortKey, setSortKey] = useState(query.sort || "title");
  const [sortedCourses, setSortedCourses] = useState(
    sortCourses(courses, sortKey)
  );
  return (
    <>
      <h1>Courses</h1>
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
