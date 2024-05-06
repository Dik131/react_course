import Post from "./Post";
import { useState, useEffect } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(API_URL);
        const posts = await response.json();
        setPosts(posts);
      } catch (error) {
        setError(error.message);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, []);
  // useEffect(() => {
  //   fetch(API_URL)
  //     .then((res) => res.json())
  //     .then((posts) => {
  //       console.log(posts);
  //       setPosts(posts);
  //     })
  //     .catch((error) => console.log(error.message))
  //     .finally(() => setIsLoading(false));
  // }, []);
  if (error) {
    return <h1>Error: {error}</h1>;
  }
  return (
    <>
      <h1>Posts</h1>
      <hr />
      <br />
      {isLoading ? (
        <h1>Loading...</h1>
      ) : (
        posts.map((post) => <Post key={post.id} {...post} />)
      )}
    </>
  );
};

export default Posts;