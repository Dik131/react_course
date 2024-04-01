import './Login.css';
import { useState } from 'react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
          value={username}
          placeholder="Enter your username"
        />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={password}
          placeholder="********"
        />
        <button type="submit">Login</button>
      </form>
    </>
  );
};
export default Login;
