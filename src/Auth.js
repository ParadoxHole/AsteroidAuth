import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { database, ref, set, push } from './firebase/firebaseConfig';
import { useAuth } from './AuthContext';

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [arcadeId, setArcadeId] = useState('');
  const [playerSeat, setPlayerSeat] = useState(''); // Default to 'blue'
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const arcadeIdParam = queryParams.get('arcadeId');
    const playerSeatParam = queryParams.get('playerSeat');
    if (arcadeIdParam) setArcadeId(arcadeIdParam);
    if (playerSeatParam) setPlayerSeat(playerSeatParam);
  }, [location]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      handleLogin(auth.currentUser.uid, arcadeId, playerSeat); // Log login event for Google sign-in
      navigate('/loggedin');
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!arcadeId || !playerSeat) {
      setError(['Arcade ID and Player Seat are required.', 'Something went wrong!', 'Scan the QR code again!']);
      return;
    }

    if (isRegister && password.length < 6) {
      setError(['Password should be at least 6 characters long']);
      return;
    }
    try {
      let userId;
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      }
      handleLogin(userId, arcadeId, playerSeat); // Log login event for email/password sign-in
      console.log('User logged in:', userId);
      navigate('/loggedin');
    } catch (error) {
      setError([error.message]);
      console.error(error);
    }
  };

  const handleLogin = (userId, arcadeId, playerSeat) => {
    console.log('Login event recorded for user:', userId);
    // Generate a unique key for the new login event
    const uniqueKey = `${Date.now()}_${userId}`;

    // Create a reference to the new login event path
    const newLoginRef = ref(database, `loginEvents/${uniqueKey}`);

    // Write a record to the new key in the Firebase Realtime Database indicating the login event
    set(newLoginRef, {
      userId: userId,
      arcadeId: arcadeId,
      playerSeat: playerSeat,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        {error.length > 0 && (
          <div className="error-message">
            {error.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <button onClick={handleGoogleSignIn} className="google-signin">
          Sign in with Google
        </button>
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-link">
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </header>
    </div>
  );
}

export default Auth;