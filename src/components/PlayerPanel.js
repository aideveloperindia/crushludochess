import React from 'react';
import './PlayerPanel.css';

const PlayerPanel = ({ team, player, isCurrentPlayer }) => {
  const getTeamColor = (team) => {
    const colors = {
      'blue': '#0066cc',
      'red': '#cc0000',
      'yellow': '#ccaa00',
      'green': '#00aa00'
    };
    return colors[team] || '#000000';
  };

  const getProgressPercentage = () => {
    return Math.min((player.kingProgress / 8) * 100, 100);
  };

  return (
    <div className={`player-panel ${isCurrentPlayer ? 'current' : ''}`}>
      <div className="player-header">
        <div 
          className="team-color"
          style={{ backgroundColor: getTeamColor(team) }}
        ></div>
        <h3 className="team-name">{team.toUpperCase()}</h3>
        {isCurrentPlayer && <span className="current-indicator">▶</span>}
      </div>
      
      <div className="player-stats">
        <div className="stat-row">
          <span className="stat-label">Points:</span>
          <span className="stat-value">{player.points}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Progress:</span>
          <span className="stat-value">{player.kingProgress}/8</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Pieces:</span>
          <span className="stat-value">{player.pieces}</span>
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${getProgressPercentage()}%`,
            backgroundColor: getTeamColor(team)
          }}
        ></div>
      </div>
      
      {player.kingProgress >= 4 && (
        <div className="home-stretch">
          🏠 Home Stretch!
        </div>
      )}
    </div>
  );
};

export default PlayerPanel; 