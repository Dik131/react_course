import './Login.css';

const Login = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const userData = {
      username: event.target.username.value,
      password: event.target.password.value,
    };
    alert(JSON.stringify(userData));
  };
  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your username"
        />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          placeholder="********"
        />
        <button type="submit">Login</button>
      </form>
    </>
  );
};
export default Login;
