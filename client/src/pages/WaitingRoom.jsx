import { useState } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/WaitingRoom.css';

export function WaitingRoom({ onGameStarted, onLeave }) {
  const [numTeams, setNumTeams] = useState(2);
  const { roomId, players, isHost, startGame, leaveRoom, loading, error } = useGame();

  const handleStartGame = async () => {
    try {
      await startGame(numTeams);
      onGameStarted();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      onLeave();
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room code copied to clipboard!');
  };

  return (
    <div className="waiting-room-container">
      <div className="waiting-room-card">
        <h1>🎮 Waiting Room</h1>

        <div className="room-code-section">
          <div className="room-code-label">Room Code</div>
          <div className="room-code-display" onClick={copyRoomCode}>
            {roomId}
            <span className="copy-hint">📋 Click to copy</span>
          </div>
        </div>

        <div className="players-section">
          <h2>Players ({players.length})</h2>
          <div className="players-list">
            {players.map((player) => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.username}</span>
                {player.socketId === players.find(p => p.id === player.id)?.socketId &&
                 roomId && players[0]?.socketId === player.socketId && (
                  <span className="host-badge">👑 Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="game-settings">
            <h3>Game Settings</h3>
            <div className="setting-group">
              <label htmlFor="numTeams">Number of Teams:</label>
              <select
                id="numTeams"
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="select-teams"
              >
                <option value={2}>2 Teams</option>
                <option value={3}>3 Teams</option>
                <option value={4}>4 Teams</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="waiting-room-actions">
          {isHost ? (
            <button
              className="btn btn-primary btn-large"
              onClick={handleStartGame}
              disabled={loading || players.length < 2}
            >
              {loading ? 'Starting...' : `Start Game`}
            </button>
          ) : (
            <div className="waiting-message">
              ⏳ Waiting for host to start the game...
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleLeaveRoom}
            disabled={loading}
          >
            Leave Room
          </button>
        </div>

        {players.length < 2 && (
          <div className="info-message">
            ℹ️ Need at least 2 players to start
          </div>
        )}
      </div>
    </div>
  );
}
