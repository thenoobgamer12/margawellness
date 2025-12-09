import React, { useState } from 'react';
import logo from './assets/logo.jpg';
import styles from './LoginPage.module.css';

const LoginPage = ({ onLogin }) => { // Removed 'users' prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => { // Made async
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3002/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
          data = await response.json();
      } else {
          // If not JSON, assume it's a plain text error or empty response
          data = { message: await response.text() || response.statusText || 'Unknown error' };
      }
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error or server unavailable.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Marga Logo" className={styles.logo} />
        </div>
        <h2 className={styles.title}>
          Login to your account
        </h2>
        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p className={styles.error}>{error}</p>}
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className={styles.rememberGroup}>
            <label className={styles.checkboxLabel}>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className={styles.checkbox}
              />
              <span>Remember me</span>
            </label>
          </div>
          <div>
            <button type="submit" className={styles.submitButton}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
