import React, { useState } from 'react';
import './GameModeSelection.css';

const GameModeSelection = ({ onModeSelect, isSoundEnabled, setIsSoundEnabled, isBackgroundMusicEnabled, setIsBackgroundMusicEnabled }) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const gameModes = [
    {
      id: '1player',
      title: '1 Player Game',
      description: 'You (Blue) vs 3 AI Players',
      players: ['You (Blue)', 'AI (Red)', 'AI (Yellow)', 'AI (Green)'],
      icon: '👤',
      color: '#4ecdc4'
    },
    {
      id: '2player',
      title: '2 Player Game',
      description: 'You (Blue) + Friend (Yellow) vs 2 AI Players',
      players: ['You (Blue)', 'AI (Red)', 'Friend (Yellow)', 'AI (Green)'],
      icon: '👥',
      color: '#45b7d1'
    },
    {
      id: '3player',
      title: '3 Player Game',
      description: 'You (Blue) + 2 Friends vs 1 AI Player',
      players: ['You (Blue)', 'AI (Red)', 'Friend 1 (Yellow)', 'Friend 2 (Green)'],
      icon: '👨‍👩‍👧',
      color: '#96ceb4'
    },
    {
      id: '4player',
      title: '4 Player Game',
      description: 'All Human Players - No AI',
      players: ['You (Blue)', 'Friend 1 (Red)', 'Friend 2 (Yellow)', 'Friend 3 (Green)'],
      icon: '👨‍👩‍👧‍👦',
      color: '#ff6b6b'
    }
  ];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode.id);
    setIsAnimating(true);
    
    setTimeout(() => {
      onModeSelect(mode);
    }, 500);
  };

  return (
    <div className="game-mode-selection">
      <div className="floating-objects">
        {Array(40).fill(null).map((_, index) => (
          <div key={index} className="floating-object"></div>
        ))}
      </div>
      <div className="mode-selection-background">
        <div className="animated-bg">
          <div className="bg-shape bg-shape-1"></div>
          <div className="bg-shape bg-shape-2"></div>
          <div className="bg-shape bg-shape-3"></div>
        </div>
        
        <div className="mode-selection-content">
          <div className="mode-header">
            <div className="logo-container">
              <img src="/crushludochesslogo.png" alt="CrushLudoChess Logo" className="mode-logo" />
            </div>
            <h1 className="mode-title">Crush Ludo Chess</h1>
            <p className="mode-tagline">Crush Ludo Chess - The Ultimate 4 Player Game!</p>
            <div className="audio-controls">
              <button 
                className={`audio-button ${isSoundEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {isSoundEnabled ? '🔊' : '🔇'}
              </button>
              <button 
                className={`audio-button ${isBackgroundMusicEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => setIsBackgroundMusicEnabled(!isBackgroundMusicEnabled)}
                title={isBackgroundMusicEnabled ? 'Music On' : 'Music Off'}
              >
                {isBackgroundMusicEnabled ? '🎵' : '🔇'}
              </button>
            </div>
          </div>

          <div className="mode-grid">
            {gameModes.map((mode) => (
              <div
                key={mode.id}
                className={`mode-card ${selectedMode === mode.id ? 'selected' : ''} ${isAnimating ? 'animating' : ''}`}
                onClick={() => handleModeSelect(mode)}
                style={{ '--card-color': mode.color }}
              >
                <div className="mode-icon">{mode.icon}</div>
                <h3 className="mode-card-title">{mode.title}</h3>
                <p className="mode-card-description">{mode.description}</p>

                <div className="mode-card-overlay">
                  <span className="play-button">▶ PLAY</span>
                </div>
              </div>
            ))}
          </div>

                          <div className="mode-footer">
                </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelection; 