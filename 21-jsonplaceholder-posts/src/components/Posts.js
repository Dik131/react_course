import Post from "./Post";
import { useState, useEffect } from "react";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((res) => res.json())
      .then((posts) => {
        console.log(posts);
        setPosts(posts);
      })
      .catch((error) => console.log(error.message));
  }, []);

  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post.id}
          // id={post.userId}
          // title={post.title}
          // body={post.body}
          {...post}
        />
      ))}
    </div>
  );
};

export default Posts;
