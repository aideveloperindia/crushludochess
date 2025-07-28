import React from 'react';
import './GameInfo.css';

const GameInfo = ({ currentPlayer, turnNumber, gamePhase, isCascading, teams }) => {
  const getTeamColor = (teamIndex) => {
    const colors = ['#0066cc', '#cc0000', '#ccaa00', '#00aa00'];
    return colors[teamIndex] || '#000000';
  };

  return (
    <div className="game-info-panel">
      <div className="current-player">
        <h3>Current Player</h3>
        <div 
          className="player-indicator"
          style={{ backgroundColor: getTeamColor(currentPlayer) }}
        >
          {teams[currentPlayer].toUpperCase()}
        </div>
      </div>
      
      <div className="turn-info">
        <h3>Game Status</h3>
        <p>Turn: {turnNumber}</p>
        <p>Phase: {gamePhase}</p>
        {isCascading && <p className="cascading-status">🔄 Cascading in progress...</p>}
      </div>
      
      <div className="how-to-play">
        <h3>How to Play</h3>
        <ul>
          <li>🎯 Capture pieces to earn points and advance your king</li>
          <li>♟️ Move pieces according to standard chess rules</li>
          <li>⚡ Cascading occurs after captures - pieces fall and new ones spawn</li>
          <li>👑 First king to reach 8 points wins!</li>
          <li>🎨 Blue → Red → Yellow → Green (clockwise turns)</li>
        </ul>
      </div>
      
      <div className="piece-values">
        <h3>Piece Values</h3>
        <div className="value-grid">
          <div className="value-item">
            <span>♕</span> Queen = 6 points
          </div>
          <div className="value-item">
            <span>♖</span> Rook = 5 points
          </div>
          <div className="value-item">
            <span>♗</span> Bishop = 4 points
          </div>
          <div className="value-item">
            <span>♘</span> Knight = 3 points
          </div>
          <div className="value-item">
            <span>♙</span> Pawn = 2 points
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo; 