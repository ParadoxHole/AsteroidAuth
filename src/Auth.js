import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { database, ref, set, get } from './firebase/firebaseConfig';

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [arcadeId, setArcadeId] = useState('');
  const [playerSeat, setPlayerSeat] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const arcadeIdParam = queryParams.get('arcadeId');
    const playerSeatParam = queryParams.get('playerSeat');
    if (arcadeIdParam) setArcadeId(arcadeIdParam);
    if (playerSeatParam) setPlayerSeat(playerSeatParam);
    if (error) {
      setError(error);
      console.log('HAZAZEAEAZE')
    }
  }, [location]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const userId = result.user.uid;
      checkSeatAvailability(userId, arcadeId, playerSeat, () => {
        localStorage.setItem('arcadeId', arcadeId);
        localStorage.setItem('playerSeat', playerSeat);
        localStorage.setItem('Selected seat is already occupied. Please choose another seat.', error);

        navigate('/loggedin');
      });
    } catch (error) {
      console.error(error);
      setError([error.message]);
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
      checkSeatAvailability(userId, arcadeId, playerSeat, () => {
        localStorage.setItem('arcadeId', arcadeId);
        localStorage.setItem('playerSeat', playerSeat);
        localStorage.setItem('Selected seat is already occupied. Please choose another seat.', error);
        navigate('/loggedin');
      });
    } catch (error) {
      setError([error.message]);
      console.error(error);
    }
  };

  const checkSeatAvailability = async (userId, arcadeId, playerSeat, onSuccess) => {
    try {
      const seatRef = ref(database, `seats/${arcadeId}/${playerSeat}`);
      const seatSnapshot = await get(seatRef);

      if (seatSnapshot.exists() && seatSnapshot.val().userId !== userId) {
        localStorage.setItem('Selected seat is already occupied. Please choose another seat.', error);
        console.log('Selected seat is already occupied. Please choose another seat.');
        navigate('/', { state: { error: 'Selected seat is already occupied. Please choose another seat.' } });
      } else {
        handleLogin(userId, arcadeId, playerSeat);
        onSuccess();
      }
    } catch (error) {
      setError([error.message]);
      console.error(error);
    }
  };

  const handleLogin = (userId, arcadeId, playerSeat) => {
    console.log('Login event recorded for user:', userId);
    const seatRef = ref(database, `seats/${arcadeId}/${playerSeat}`);

    set(seatRef, {
      userId: userId,
      timestamp: Date.now(),
    });

    const uniqueKey = `${Date.now()}_${userId}`;
    const newLoginRef = ref(database, `loginEvents/${uniqueKey}`);

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
