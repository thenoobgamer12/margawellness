import React, { useState } from 'react';
import logo from './assets/logo.jpg';
import styles from './LoginPage.module.css';

const LoginPage = ({ onLogin }) => { // Removed 'users' prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => { // Renamed handleLogin to handleSubmit for clarity
    e.preventDefault();
    setError('');

    // Call the onLogin prop, which now handles API communication and returns a boolean
    const success = await onLogin({ username, password });

    if (!success) {
      setError('Invalid username or password.'); // Error message is now generic, as specific error comes from App.jsx
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
        <form className={styles.form} onSubmit={handleSubmit}> {/* Changed handleLogin to handleSubmit */}
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