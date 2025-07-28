import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoScale, setLogoScale] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);

  useEffect(() => {
    // Animate logo entrance
    setTimeout(() => {
      setLogoScale(1);
      setLogoOpacity(1);
    }, 100);

    // Show splash for 2 seconds then transition
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 300); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="splash-screen">
      <div className="splash-background">
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}></div>
          ))}
        </div>
        
        <div className="logo-container">
          <div 
            className="game-logo"
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity
            }}
          >
            <img src="/crushludochesslogo.png" alt="CRUSHLUDOCHESS" />
            <h1 className="game-title">CRUSHLUDOCHESS</h1>
            <div className="subtitle">The Ultimate Chess-Ludo Fusion</div>
          </div>
        </div>

        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen; 