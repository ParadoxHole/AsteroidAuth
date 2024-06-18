import React from 'react';
import { useAuth } from './AuthContext';

const LoggedIn = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome, {currentUser?.email}</h1>
        <p>You are logged in!</p>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>
    </div>
  );
};

export default LoggedIn;