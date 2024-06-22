import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Auth from './Auth'; // Assuming Auth component is extracted to Auth.js
import LoggedIn from './LoggedIn';
import AdminPage from './AdminPage';


function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to="/loggedin" /> : <Auth />} />
        <Route path="/loggedin" element={currentUser ? <LoggedIn /> : <Navigate to="/" />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default function RootApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}