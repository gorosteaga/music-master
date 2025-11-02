import { useGame } from '../context/GameContext';
import '../styles/Game.css';

export function Game({ onLeaveGame }) {
  const {
    roomId,
    players,
    teams,
    currentTeamId,
    myTeamId,
    isMyTurn,
    endTurn,
    leaveRoom,
    loading,
    error,
    turnInfo
  } = useGame();

  const handleEndTurn = async () => {
    try {
      await endTurn();
    } catch (err) {
      console.error('Failed to end turn:', err);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await leaveRoom();
      onLeaveGame();
    } catch (err) {
      console.error('Failed to leave game:', err);
    }
  };

  const getCurrentTeam = () => {
    return teams.find(t => t.id === currentTeamId);
  };

  const getMyTeam = () => {
    return teams.find(t => t.id === myTeamId);
  };

  const getPlayersByTeam = (teamId) => {
    return players.filter(p => p.teamId === teamId);
  };

  const currentTeam = getCurrentTeam();
  const myTeam = getMyTeam();

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="room-info">
          <span className="room-code-small">Room: {roomId}</span>
        </div>
        <button className="btn btn-small btn-secondary" onClick={handleLeaveGame}>
          Leave Game
        </button>
      </div>

      <div className="game-content">
        {/* Turn Indicator */}
        <div className={`turn-indicator ${isMyTurn() ? 'my-turn' : 'not-my-turn'}`}>
          {isMyTurn() ? (
            <>
              <div className="turn-message">🎯 Your Turn!</div>
              <div className="turn-team">Team: {myTeam?.name}</div>
            </>
          ) : (
            <>
              <div className="turn-message">⏳ Waiting...</div>
              <div className="turn-team">Current Turn: {currentTeam?.name}</div>
            </>
          )}
        </div>

        {/* Game Board Placeholder */}
        <div className="game-board">
          <div className="game-board-placeholder">
            <h2>🎮 Game Board</h2>
            <p>Game logic will be implemented here</p>
            <div className="placeholder-info">
              <p>Turn #{turnInfo?.currentTurn + 1}</p>
              <p>Current Team: {currentTeam?.name}</p>
            </div>
          </div>
        </div>

        {/* Turn Actions */}
        {isMyTurn() && (
          <div className="turn-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleEndTurn}
              disabled={loading}
            >
              {loading ? 'Ending Turn...' : 'End Turn'}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Teams Sidebar */}
        <div className="teams-sidebar">
          <h3>Teams</h3>
          {teams.map((team) => (
            <div
              key={team.id}
              className={`team-card ${team.id === currentTeamId ? 'active-team' : ''} ${
                team.id === myTeamId ? 'my-team' : ''
              }`}
            >
              <div className="team-header">
                <span className="team-name">{team.name}</span>
                {team.id === currentTeamId && <span className="turn-badge">🎯</span>}
                {team.id === myTeamId && <span className="my-badge">👤</span>}
              </div>
              <div className="team-players">
                {getPlayersByTeam(team.id).map((player) => (
                  <div key={player.id} className="team-player">
                    {player.username}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
