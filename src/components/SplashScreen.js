import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, title = "CrushLudoChess", subtitle = "The Ultimate 4 Player Game" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoScale, setLogoScale] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    // Animate logo entrance
    setTimeout(() => {
      setLogoScale(1);
    }, 100);

    // Animate text entrance
    setTimeout(() => {
      setTextOpacity(1);
    }, 800);

    // Hide splash screen after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3000);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="floating-objects">
        <div className="floating-object"></div>
        <div className="floating-object"></div>
        <div className="floating-object"></div>
        <div className="floating-object"></div>
      </div>
      <div className="splash-content">
        <div 
          className="splash-logo"
          style={{ transform: `scale(${logoScale})` }}
        >
          <img 
            src="/crushludochesslogo.png" 
            alt="CrushLudoChess Logo" 
            className="logo-image"
          />
        </div>
        
        <div 
          className="splash-text"
          style={{ opacity: textOpacity }}
        >
          <h1 className="splash-title">{title}</h1>
          <p className="splash-subtitle">{subtitle}</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen; 