import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { auth, database } from './firebase/firebaseConfig';
import './App.css';

function LoggedIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [arcadeId, setArcadeId] = useState('');
  const [playerSeat, setPlayerSeat] = useState('');
  const [newSeat, setNewSeat] = useState('');
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [arcadeName, setArcadeName] = useState('');
  const [arcades, setArcades] = useState([]);

  const fetchArcadeName = async (arcadeId) => {
    try {
      const arcadeRef = ref(database, `Arcade/${arcadeId}`);
      const arcadeSnapshot = await get(arcadeRef);
      if (arcadeSnapshot.exists()) {
        setArcadeName(arcadeSnapshot.val().name);
      } else {
        setError('Arcade not found');
      }
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };
  useEffect(() => {

    const fetchArcades = async () => {
      try {
        const arcadesRef = ref(database, 'Arcade');
        const arcadesSnapshot = await get(arcadesRef);
        if (arcadesSnapshot.exists()) {
          setArcades(Object.entries(arcadesSnapshot.val()));
        } else {
          setArcades([]);
        }
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };

    fetchArcades();

    const storedArcadeId = localStorage.getItem('arcadeId');
    const storedPlayerSeat = localStorage.getItem('playerSeat');

    // Check for local storage or navigation state
    const arcadeIdFromState = location.state?.arcadeId;
    const playerSeatFromState = location.state?.playerSeat;

    if (storedArcadeId || arcadeIdFromState) {
      const finalArcadeId = storedArcadeId || arcadeIdFromState;
      setArcadeId(finalArcadeId);
      fetchArcadeName(finalArcadeId);
    }

    if (storedPlayerSeat || playerSeatFromState) {
      setPlayerSeat(storedPlayerSeat || playerSeatFromState);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
    }

    if (location.state?.error) {
      setError(location.state.error);
      console.error(location.state.error);
    }
  }, [location, error]);

  const handleNewSeatSelection = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser.uid;
    if (!newSeat) {
      setError('Please choose a new seat color.');
      return;
    }

    try {
      const seatRef = ref(database, `seats/${arcadeId}/${newSeat}`);
      const seatSnapshot = await get(seatRef);

      if (seatSnapshot.exists() && seatSnapshot.val().userId !== userId) {
        setError('Selected seat is already occupied. Please choose another seat.');
      } else {
        // Free the old seat
        const oldSeatRef = ref(database, `seats/${arcadeId}/${playerSeat}`);
        await set(oldSeatRef, { userId: '', timestamp: Date.now() });

        // Occupy the new seat
        await set(seatRef, { userId: userId, timestamp: Date.now() });

        // Update the login event
        const uniqueKey = `${Date.now()}_${userId}`;
        const newLoginRef = ref(database, `loginEvents/${uniqueKey}`);
        await set(newLoginRef, {
          userId: userId,
          arcadeId: arcadeId,
          playerSeat: newSeat,
          timestamp: Date.now(),
        });

        // Update state
        setPlayerSeat(newSeat);
        setError('');
      }
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  const handleArcadeSelection = (e) => {
    const selectedArcadeId = e.target.value;
    setArcadeId(selectedArcadeId);
    fetchArcadeName(selectedArcadeId);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Redirect to login page after logout
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome, {userEmail}</h1>
        <div className="arcade-info">
          <div className="arcade-details">
            <p>Arcade: {arcadeName}</p>
            <p>Current Seat: {playerSeat}</p>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          <form onSubmit={handleNewSeatSelection} className="seat-form">
            <div className="select-container">
              {error && <div className="error-message">{error}</div>}
              <label>
                Select Arcade:
                <select value={arcadeId} onChange={handleArcadeSelection}>
                  <option value="">Select an arcade</option>
                  {arcades.map(([id, arcade]) => (
                    <option key={id} value={id}>{arcade.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Choose a new seat color:
                <select value={newSeat} onChange={(e) => setNewSeat(e.target.value)}>
                  <option value="">Select a seat</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                </select>
              </label>
              <button type="submit">Change Seat</button>
            </div>
          </form>
        </div>
      </header>
    </div>
  );
}

export default LoggedIn;
