import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database, ref, get, set } from './firebase/firebaseConfig';
import { auth } from './firebase/firebaseConfig';
import './App.css'; // Import your CSS file
import { useLocation } from 'react-router-dom';


function LoggedIn() {
  const navigate = useNavigate();
  const [arcadeId, setArcadeId] = useState('');
  const [playerSeat, setPlayerSeat] = useState('');
  const [newSeat, setNewSeat] = useState('');
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [arcadeName, setArcadeName] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchArcadeName = async (arcadeId) => {
      try {
        console.log('arcadeId', arcadeId);
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

    const storedArcadeId = localStorage.getItem('arcadeId');
    const storedPlayerSeat = localStorage.getItem('playerSeat');
    if (storedArcadeId) {
      setArcadeId(storedArcadeId);
      fetchArcadeName(storedArcadeId);
    }    
    if (storedPlayerSeat) setPlayerSeat(storedPlayerSeat);

    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
    }
    if (location.state && location.state.error) {
      setError(location.state.error);
      console.error(location.state.error);
    }
  }, []);

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
  
      if (seatSnapshot.exists()) {
        const currentUserId = seatSnapshot.val().userId;
  
        if (currentUserId && currentUserId !== userId) {
          setError('Selected seat is already occupied. Please choose another seat.');
          navigate('/', { state: { error: 'Selected seat is already occupied. Please choose another seat.' } });
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
      } else {
        setError('Selected seat does not exist. Please choose another seat.');
      }
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
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
                Choose a new seat color :
                <select value={playerSeat} onChange={(e) => setNewSeat(e.target.value)}>
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
