import './Login.css';
import { useState } from 'react';

const Login = () => {
  // const [username, setUsername] = useState('');
  // const [password, setPassword] = useState('');

  const [data, setData] = useState({ username: '', password: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    // const userData = {
    //   username: data.username,
    //   password: data.password,
    // };
    console.log(data);
    alert(JSON.stringify(data));
  };

  const handleInputChange = (event, name) => {
    setData({ ...data, [name]: event.target.value });
  };

  return (
    <>
      <h1>Login form</h1>
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input
          type="text"
          value={data.username}
          //onChange={(event) => setData({ ...data, username: event.target.value })}
          onChange={(event) => handleInputChange(event, 'username')}
          placeholder="Enter your username"
        />
        <label>Password:</label>
        <input
          type="password"
          value={data.password}
          //onChange={(event) => setData({ ...data, password: event.target.value })}
          onChange={(event) => handleInputChange(event, 'password')}
          placeholder="********"
        />
        <button type="submit">Login</button>
      </form>
    </>
  );
};
export default Login;
