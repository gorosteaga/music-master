import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Home } from './pages/Home';
import { WaitingRoom } from './pages/WaitingRoom';
import { Game } from './pages/Game';

function AppContent() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'waiting', 'game'
  const { gameStarted } = useGame();

  const handleRoomJoined = () => {
    setCurrentView('waiting');
  };

  const handleGameStarted = () => {
    setCurrentView('game');
  };

  const handleLeave = () => {
    setCurrentView('home');
  };

  // Auto-navigate to game when game starts
  if (gameStarted && currentView !== 'game') {
    setCurrentView('game');
  }

  return (
    <>
      {currentView === 'home' && <Home onRoomJoined={handleRoomJoined} />}
      {currentView === 'waiting' && (
        <WaitingRoom onGameStarted={handleGameStarted} onLeave={handleLeave} />
      )}
      {currentView === 'game' && <Game onLeaveGame={handleLeave} />}
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
