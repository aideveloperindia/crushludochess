import React from 'react';
import './GameInfo.css';

const GameInfo = ({ currentPlayer, turn, gamePhase }) => {
  const getPlayerColor = (player) => {
    const colors = {
      'blue': '#0066cc',
      'red': '#cc0000',
      'yellow': '#ccaa00',
      'green': '#00aa00'
    };
    return colors[player] || '#000000';
  };

  return (
    <div className="game-info">
      <div className="info-header">
        <h2>Game Status</h2>
      </div>
      
      <div className="info-content">
        <div className="current-player">
          <h3>Current Player:</h3>
          <div 
            className="player-indicator"
            style={{ backgroundColor: getPlayerColor(currentPlayer) }}
          >
            {currentPlayer.toUpperCase()}
          </div>
        </div>
        
        <div className="turn-info">
          <h3>Turn:</h3>
          <span className="turn-number">{turn}</span>
        </div>
        
        <div className="game-phase">
          <h3>Phase:</h3>
          <span className="phase-status">{gamePhase}</span>
        </div>
      </div>
      
      <div className="game-rules">
        <h3>How to Play:</h3>
        <ul>
          <li>Click your piece to select it</li>
          <li>Click destination to move</li>
          <li>Capture enemy pieces to earn points</li>
          <li>Reach 4+ points to win!</li>
        </ul>
      </div>
    </div>
  );
};

export default GameInfo; 