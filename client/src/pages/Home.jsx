import { useState } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/Home.css';

export function Home({ onRoomJoined }) {
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const { createRoom, joinRoom, loading, connected } = useGame();

  const handleCreateRoom = async () => {
    try {
      setJoinError('');
      const newRoomId = await createRoom();
      console.log('Room created:', newRoomId);
      onRoomJoined();
    } catch (error) {
      setJoinError(error.message);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    try {
      setJoinError('');
      await joinRoom(roomCode.toUpperCase().trim());
      onRoomJoined();
    } catch (error) {
      setJoinError(error.message);
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🎮 Multiplayer Game</h1>

        {!connected && (
          <div className="connection-status disconnected">
            🔴 Connecting to server...
          </div>
        )}

        {connected && (
          <div className="connection-status connected">
            🟢 Connected
          </div>
        )}

        <div className="home-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleCreateRoom}
            disabled={loading || !connected}
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleJoinRoom} className="join-form">
            <input
              type="text"
              className="input-code"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={loading || !connected}
            />
            <button
              type="submit"
              className="btn btn-secondary btn-large"
              disabled={loading || !connected || !roomCode.trim()}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>

        {joinError && (
          <div className="error-message">
            ⚠️ {joinError}
          </div>
        )}
      </div>
    </div>
  );
}
