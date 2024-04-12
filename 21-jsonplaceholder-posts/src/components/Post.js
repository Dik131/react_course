const Post = (props) => {
  // console.log(props)
  const { userId, id, title, body } = props;
  return (
    <>
      <small>{id}</small>
      <h2>{title}</h2>
      <p>{body}</p>
      <h3>User ID:{userId}</h3>
    </>
  );
};

export default Post;
