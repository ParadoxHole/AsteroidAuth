import React, { useState, useEffect } from 'react';
import { ref, get, set, remove, push } from 'firebase/database';
import { database } from './firebase/firebaseConfig';
import './App.css'; // Import your CSS file

function AdminPage() {
  const [arcades, setArcades] = useState([]);
  const [arcadeName, setArcadeName] = useState('');
  const [selectedArcadeId, setSelectedArcadeId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArcades();
  }, []);

  const fetchArcades = async () => {
    try {
      const arcadesRef = ref(database, 'Arcade');
      const snapshot = await get(arcadesRef);
      if (snapshot.exists()) {
        setArcades(Object.entries(snapshot.val()));
      } else {
        setArcades([]);
      }
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  const handleCreateOrUpdateArcade = async (e) => {
    e.preventDefault();
    try {
      if (selectedArcadeId) {
        const arcadeRef = ref(database, `Arcade/${selectedArcadeId}`);
        await set(arcadeRef, { name: arcadeName });
      } else {
        const counterRef = ref(database, 'arcadeCounter');
        const counterSnapshot = await get(counterRef);
        let newArcadeId = 1;

        if (counterSnapshot.exists()) {
          newArcadeId = counterSnapshot.val() + 1;
        }

        const arcadeRef = ref(database, `Arcade/${newArcadeId}`);
        await set(arcadeRef, { name: arcadeName});
        await set(counterRef, newArcadeId); // Update the counter in the database
      }
      setArcadeName('');
      setSelectedArcadeId(null);
      fetchArcades();
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  const handleDeleteArcade = async (arcadeId) => {
    try {
      const arcadeRef = ref(database, `Arcade/${arcadeId}`);
      await remove(arcadeRef);
      fetchArcades();
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  const handleEditArcade = (arcadeId, name) => {
    setSelectedArcadeId(arcadeId);
    setArcadeName(name);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Admin Page</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleCreateOrUpdateArcade} className="admin-form">
          <input
            type="text"
            placeholder="Arcade Name"
            value={arcadeName}
            onChange={(e) => setArcadeName(e.target.value)}
            required
          />
          <button type="submit">{selectedArcadeId ? 'Update Arcade' : 'Create Arcade'}</button>
        </form>
        <div className="arcade-list">
          {arcades.map(([id, arcade]) => (
            <div key={id} className="arcade-item">
              <span>{arcade.name} (ID: {id})</span> 
              <button onClick={() => handleEditArcade(id, arcade.name)}>Edit</button>
              <button onClick={() => handleDeleteArcade(id)}>Delete</button>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default AdminPage;
