import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameModeSelection from './components/GameModeSelection';
import SplashScreen from './components/SplashScreen';

// Piece types and their values
const PIECE_VALUES = {
  'queen': 6,
  'rook': 5,
  'bishop': 4,
  'knight': 3,
  'pawn': 2, // First pawn capture = 2 points
  'king': 0 // Kings don't have capture value
};

// Team colors and positions
const TEAMS = ['blue', 'red', 'yellow', 'green'];
const TEAM_COLORS = ['#4A90E2', '#E74C3C', '#F39C12', '#27AE60']; // Soft Blue, Soft Red, Soft Orange, Soft Green

function App() {
  // Game flow states
  const [appPhase, setAppPhase] = useState('splash'); // 'splash', 'mode-selection', 'game'
  const [selectedGameMode, setSelectedGameMode] = useState(null);
  
  // Game states
  const [board, setBoard] = useState([]);
  const [kingPositions, setKingPositions] = useState([0, 8, 16, 24]); // B1, B9, B17, B25 (FIRST boxes) - using 0-based indexing
  const [cascadeHighlights, setCascadeHighlights] = useState([]); // For showing cascade boxes
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playerPoints, setPlayerPoints] = useState([0, 0, 0, 0]);
  const [kingProgress, setKingProgress] = useState([1, 1, 1, 1]);
  const [pawnCaptures, setPawnCaptures] = useState([0, 0, 0, 0]); // Track pawn captures per player
  const [gamePhase, setGamePhase] = useState('setup');
  const [winningPlayer, setWinningPlayer] = useState(null); // Track the actual winner
  const [showQueenKillModal, setShowQueenKillModal] = useState(false);
  const [showThroneModal, setShowThroneModal] = useState(false);
  const [killedQueenTeam, setKilledQueenTeam] = useState(null);
  const [throneTeam, setThroneTeam] = useState(null);

  const [isCascading, setIsCascading] = useState(false);
  const [playerNames, setPlayerNames] = useState(['Name', 'Name', 'Name', 'Name']);
  
  // Indian AI player names
  const AI_NAMES = {
    1: ['Arjun', 'Priya', 'Vikram', 'Anjali'],
    2: ['Rahul', 'Meera', 'Aditya', 'Zara'],
    3: ['Krishna', 'Lakshmi', 'Shiva', 'Parvati']
  };
  
  // Define which positions are human players for each game mode
  const HUMAN_POSITIONS = {
    1: [0], // Blue only
    2: [0, 2], // Blue and Yellow
    3: [0, 1, 2] // Blue, Red, and Yellow
  };
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isBackgroundMusicEnabled, setIsBackgroundMusicEnabled] = useState(true);

  // Audio functions using actual audio files
  const playSound = (soundType) => {
    if (!isSoundEnabled) return;
    
    try {
      const audio = new Audio();
      
      switch (soundType) {
        case 'move':
          audio.src = '/audio/king movement sound.wav';
          break;
        case 'capture':
          audio.src = '/audio/capture sound.ogg';
          break;
        case 'queen-capture':
          audio.src = '/audio/queen kill sound.mp3';
          break;
        case 'king-capture':
          audio.src = '/audio/king kill sound.mp3';
          break;
        case 'cascade':
          audio.src = '/audio/capture sound.ogg';
          break;
        case '32-box-complete':
          audio.src = '/audio/32 box sound.wav';
          break;
        case 'victory':
          audio.src = '/audio/victory sound.mp3';
          break;
        default:
          return;
      }
      
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      // Add event listeners for better debugging
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio loaded successfully: ${soundType}`);
        // Try to play when loaded
        audio.play().catch((error) => {
          console.log(`Audio playback failed for ${soundType}:`, error);
        });
      });
      
      audio.addEventListener('error', (e) => {
        console.log(`Audio error for ${soundType}:`, e);
      });
      
      // Try to play immediately
      audio.play().catch((error) => {
        console.log(`Audio playback failed for ${soundType}:`, error);
      });
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Fix sound button handler - prevent event bubbling
  const handleSoundToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSoundEnabled(!isSoundEnabled);
  };

  // Global audio instance - only one music instance for the entire game
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  
  const playBackgroundMusic = useCallback(() => {
    // If music is disabled, don't play
    if (!isBackgroundMusicEnabled) {
      if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
      }
      return;
    }
    
    // If we already have a music instance, just resume it
    if (backgroundAudio) {
      backgroundAudio.play().catch((error) => {
        console.log('Failed to resume existing music:', error);
      });
      return;
    }
    
    // Create new music instance only if we don't have one
    try {
      const audio = new Audio('/audio/background music.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        console.log('Background music loaded successfully');
        if (isBackgroundMusicEnabled) {
          audio.play().then(() => {
            setBackgroundAudio(audio);
            console.log('Background music started successfully');
          }).catch((error) => {
            console.log('Background music playback failed:', error);
          });
        }
      });
      
      audio.addEventListener('error', (e) => {
        console.log('Background music error:', e);
      });
      
      // Try to play immediately
      audio.play().then(() => {
        setBackgroundAudio(audio);
        console.log('Background music started successfully');
      }).catch((error) => {
        console.log('Background music playback failed:', error);
      });
    } catch (error) {
      console.log('Background music not supported:', error);
    }
  }, [isBackgroundMusicEnabled, backgroundAudio]);

  // Consolidated background music control - only one instance
  useEffect(() => {
    if (appPhase === 'game') {
      if (isBackgroundMusicEnabled) {
        // Start/resume music when game begins and music is enabled
        playBackgroundMusic();
      } else if (backgroundAudio) {
        // Pause music when muted (keep the instance)
        backgroundAudio.pause();
      }
    } else {
      // Pause music when not in game (don't destroy instance)
      if (backgroundAudio) {
        backgroundAudio.pause();
      }
    }
  }, [isBackgroundMusicEnabled, appPhase, backgroundAudio, playBackgroundMusic]);

  // Fix music button click handler - prevent event bubbling
  const handleMusicToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newMusicState = !isBackgroundMusicEnabled;
    setIsBackgroundMusicEnabled(newMusicState);
    
    // Immediately handle the music state change
    if (!newMusicState && backgroundAudio) {
      // Muting - pause the current audio (don't destroy it)
      backgroundAudio.pause();
      console.log('Music muted');
    } else if (newMusicState && backgroundAudio && appPhase === 'game') {
      // Unmuting - resume the existing audio only if in game
      backgroundAudio.play().catch((error) => {
        console.log('Failed to resume music:', error);
      });
      console.log('Music unmuted');
    } else if (newMusicState && appPhase === 'game' && !backgroundAudio) {
      // First time starting music
      playBackgroundMusic();
      console.log('Music started for first time');
    }
  };

  // Initialize the game board when game starts
  useEffect(() => {
    if (appPhase === 'game') {
      // Add user interaction handler to enable audio
      const enableAudioOnInteraction = () => {
        // Create a silent audio context to unlock audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        // Try to play a silent sound to unlock audio
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        silentAudio.play().catch(() => {});
        
        // Remove the event listeners
        document.removeEventListener('click', enableAudioOnInteraction);
        document.removeEventListener('keydown', enableAudioOnInteraction);
        document.removeEventListener('touchstart', enableAudioOnInteraction);
      };
      
      document.addEventListener('click', enableAudioOnInteraction);
      document.addEventListener('keydown', enableAudioOnInteraction);
      document.addEventListener('touchstart', enableAudioOnInteraction);
    }
  }, [appPhase]);



  const initializeBoard = () => {
    // Set AI names based on game mode
    if (selectedGameMode) {
      const aiNames = AI_NAMES[selectedGameMode.aiPlayers] || AI_NAMES[1];
      const newPlayerNames = [...playerNames];
      const humanPositions = HUMAN_POSITIONS[selectedGameMode.aiPlayers] || [0];
      
      // Set default names for human players at specific positions
      humanPositions.forEach((position, index) => {
        if (newPlayerNames[position] === 'Name') {
          newPlayerNames[position] = `Player ${index + 1}`;
        }
      });
      
      // Set AI names for AI players at remaining positions
      let aiIndex = 0;
      for (let i = 0; i < 4; i++) {
        if (!humanPositions.includes(i)) {
          newPlayerNames[i] = aiNames[aiIndex];
          aiIndex++;
        }
      }
      
      setPlayerNames(newPlayerNames);
    }
    
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // ULTRA HARDCODE: Define queen positions and their surrounding pieces
    const queenConfigs = [
      {
        queen: { row: 6, col: 3, teamIndex: 0 }, // Blue queen
        surrounding: [
          { row: 6, col: 2, type: 'pawn', teamIndex: 0 },     // Left
          { row: 6, col: 4, type: 'pawn', teamIndex: 0 },     // Right
          { row: 5, col: 3, type: 'knight', teamIndex: 0 },   // Above
          { row: 7, col: 3, type: 'knight', teamIndex: 0 },   // Below
          { row: 5, col: 2, type: 'bishop', teamIndex: 0 },   // Top-left
          { row: 5, col: 4, type: 'bishop', teamIndex: 0 },   // Top-right
          { row: 7, col: 2, type: 'pawn', teamIndex: 0 },     // Bottom-left
          { row: 7, col: 4, type: 'pawn', teamIndex: 0 }      // Bottom-right
        ]
      },
      {
        queen: { row: 3, col: 6, teamIndex: 1 }, // Red queen
        surrounding: [
          { row: 3, col: 5, type: 'pawn', teamIndex: 1 },     // Left
          { row: 3, col: 7, type: 'pawn', teamIndex: 1 },     // Right
          { row: 2, col: 6, type: 'knight', teamIndex: 1 },   // Above
          { row: 4, col: 6, type: 'knight', teamIndex: 1 },   // Below
          { row: 2, col: 5, type: 'bishop', teamIndex: 1 },   // Top-left
          { row: 2, col: 7, type: 'bishop', teamIndex: 1 },   // Top-right
          { row: 4, col: 5, type: 'pawn', teamIndex: 1 },     // Bottom-left
          { row: 4, col: 7, type: 'pawn', teamIndex: 1 }      // Bottom-right
        ]
      },
      {
        queen: { row: 2, col: 3, teamIndex: 2 }, // Yellow queen
        surrounding: [
          { row: 2, col: 2, type: 'pawn', teamIndex: 2 },     // Left
          { row: 2, col: 4, type: 'pawn', teamIndex: 2 },     // Right
          { row: 1, col: 3, type: 'knight', teamIndex: 2 },   // Above
          { row: 3, col: 3, type: 'knight', teamIndex: 2 },   // Below
          { row: 1, col: 2, type: 'bishop', teamIndex: 2 },   // Top-left
          { row: 1, col: 4, type: 'bishop', teamIndex: 2 },   // Top-right
          { row: 3, col: 2, type: 'pawn', teamIndex: 2 },     // Bottom-left
          { row: 3, col: 4, type: 'pawn', teamIndex: 2 }      // Bottom-right
        ]
      },
      {
        queen: { row: 3, col: 1, teamIndex: 3 }, // Green queen
        surrounding: [
          { row: 3, col: 0, type: 'pawn', teamIndex: 3 },     // Left
          { row: 3, col: 2, type: 'pawn', teamIndex: 3 },     // Right
          { row: 2, col: 1, type: 'knight', teamIndex: 3 },   // Above
          { row: 4, col: 1, type: 'knight', teamIndex: 3 },   // Below
          { row: 2, col: 0, type: 'bishop', teamIndex: 3 },   // Top-left
          { row: 2, col: 2, type: 'bishop', teamIndex: 3 },   // Top-right
          { row: 4, col: 0, type: 'pawn', teamIndex: 3 },     // Bottom-left
          { row: 4, col: 2, type: 'pawn', teamIndex: 3 }      // Bottom-right
        ]
      }
    ];
    
    // ULTRA HARDCODE: Place queens and their surrounding pieces FIRST
    queenConfigs.forEach(({ queen, surrounding }) => {
      console.log(`Placing ${TEAMS[queen.teamIndex]} queen at [${queen.row}, ${queen.col}]`);
      
      // Place queen
      newBoard[queen.row][queen.col] = { 
        type: 'queen', 
        team: TEAMS[queen.teamIndex], 
        teamIndex: queen.teamIndex 
      };
      
      // Place surrounding pieces
      surrounding.forEach(({ row, col, type, teamIndex }) => {
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
          console.log(`Placing ${TEAMS[teamIndex]} ${type} at [${row}, ${col}]`);
          newBoard[row][col] = { 
            type, 
            team: TEAMS[teamIndex], 
            teamIndex 
          };
        }
      });
    });
    
    // Fill remaining squares with random pieces
    const allPieces = [];
    TEAMS.forEach((team, teamIndex) => {
      const teamPieces = [
        { type: 'rook', team, teamIndex },
        { type: 'rook', team, teamIndex },
        { type: 'bishop', team, teamIndex },
        { type: 'bishop', team, teamIndex },
        { type: 'knight', team, teamIndex },
        { type: 'knight', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex }
      ];
      allPieces.push(...teamPieces);
    });

    const shuffledPieces = allPieces.sort(() => Math.random() - 0.5);
    let pieceIndex = 0;
    
    // Fill remaining empty squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!newBoard[row][col]) {
          if (pieceIndex < shuffledPieces.length) {
            newBoard[row][col] = shuffledPieces[pieceIndex];
            pieceIndex++;
          } else {
            const randomTeamIndex = Math.floor(Math.random() * 4);
            newBoard[row][col] = { type: 'pawn', team: TEAMS[randomTeamIndex], teamIndex: randomTeamIndex };
          }
        }
      }
    }

    // Verify orange queen surroundings
    console.log('=== VERIFYING ORANGE QUEEN SURROUNDINGS ===');
    const orangeQueenRow = 2;
    const orangeQueenCol = 3;
    console.log(`Orange queen at [${orangeQueenRow}, ${orangeQueenCol}]`);
    
    // Check all 8 surrounding positions
    const surroundingPositions = [
      { row: orangeQueenRow, col: orangeQueenCol - 1 },     // Left
      { row: orangeQueenRow, col: orangeQueenCol + 1 },     // Right
      { row: orangeQueenRow - 1, col: orangeQueenCol },     // Above
      { row: orangeQueenRow + 1, col: orangeQueenCol },     // Below
      { row: orangeQueenRow - 1, col: orangeQueenCol - 1 }, // Top-left
      { row: orangeQueenRow - 1, col: orangeQueenCol + 1 }, // Top-right
      { row: orangeQueenRow + 1, col: orangeQueenCol - 1 }, // Bottom-left
      { row: orangeQueenRow + 1, col: orangeQueenCol + 1 }  // Bottom-right
    ];
    
    surroundingPositions.forEach((pos, index) => {
      const piece = newBoard[pos.row][pos.col];
      if (piece) {
        console.log(`Position [${pos.row}, ${pos.col}]: ${piece.team} ${piece.type} (teamIndex: ${piece.teamIndex})`);
        if (piece.teamIndex !== 2) {
          console.error(`ERROR: Non-orange piece at [${pos.row}, ${pos.col}]!`);
        }
      } else {
        console.error(`ERROR: No piece at [${pos.row}, ${pos.col}]!`);
      }
    });
    console.log('=== END VERIFICATION ===');

    setBoard(newBoard);
    // Set kings at their starting positions: Blue=B1, Red=B9, Yellow=B17, Green=B25
    setKingPositions([0, 8, 16, 24]); // B1, B9, B17, B25 (using 0-based indexing for first boxes)
    setKingProgress([1, 1, 1, 1]); // Initialize progress to 1 (kings start at position 0 with progress 1)
    setPlayerPoints([0, 0, 0, 0]);
    setPawnCaptures([0, 0, 0, 0]);
    setCurrentPlayer(0); // Always start with Blue player (index 0)
    setWinningPlayer(null); // Reset winning player
    setGamePhase('playing');
  };

  // NEW PAWN MOVEMENT LOGIC
  const isValidPawnMove = (fromRow, fromCol, toRow, toCol, piece) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Team-specific pawn movement directions
    let forwardDirection;
    
    switch (piece.teamIndex) {
      case 0: // Blue - move upward towards Yellow
        forwardDirection = { row: -1, col: 0 };
        break;
      case 1: // Red - move leftward towards Green
        forwardDirection = { row: 0, col: -1 };
        break;
      case 2: // Yellow - move downward towards Blue
        forwardDirection = { row: 1, col: 0 };
        break;
      case 3: // Green - move rightward towards Red
        forwardDirection = { row: 0, col: 1 };
        break;
      default:
        return false;
    }
    
    // Forward move (no capture)
    if (rowDiff === forwardDirection.row && colDiff === forwardDirection.col && !board[toRow][toCol]) {
      return true;
    }
    
    // Diagonal capture (in forward direction)
    const diagonalMoves = [];
    if (forwardDirection.row !== 0) {
      // Vertical movement - diagonal is horizontal
      diagonalMoves.push({ row: forwardDirection.row, col: -1 });
      diagonalMoves.push({ row: forwardDirection.row, col: 1 });
    } else {
      // Horizontal movement - diagonal is vertical
      diagonalMoves.push({ row: -1, col: forwardDirection.col });
      diagonalMoves.push({ row: 1, col: forwardDirection.col });
    }
    
    for (const diagonal of diagonalMoves) {
      if (rowDiff === diagonal.row && colDiff === diagonal.col && board[toRow][toCol]) {
        return true;
      }
    }
    
    return false;
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    if (!piece) return false;
    
    // Can only move own pieces
    if (piece.teamIndex !== currentPlayer) return false;
    
    // Can't move to same position
    if (fromRow === toRow && fromCol === toCol) return false;
    
    // Can't capture own pieces
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.teamIndex === currentPlayer) return false;

    // Implement chess movement rules based on piece type
    switch (piece.type) {
      case 'pawn':
        return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
      case 'rook':
        return isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  };

  const isValidRookMove = (fromRow, fromCol, toRow, toCol) => {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    // Check if path is clear
    const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidBishopMove = (fromRow, fromCol, toRow, toCol) => {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    
    const rowStep = (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow && currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidQueenMove = (fromRow, fromCol, toRow, toCol) => {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
  };

  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  // NEW CASCADING LOGIC
  const performCascade = async (currentBoard, capturingPlayer) => {
    let newBoard = currentBoard.map(row => [...row]);
    let hasChanges = true;
    let iterations = 0;
    
    console.log(`Starting cascade for ${TEAMS[capturingPlayer]} player...`);
    
    while (hasChanges && iterations < 10) {
      hasChanges = false;
      iterations++;
      
      // Show cascade highlights before each step
      const highlights = getCascadeHighlights(newBoard, capturingPlayer);
      setCascadeHighlights(highlights);
      
      // Wait to show highlights
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 1. TEAM-SPECIFIC GRAVITY
      hasChanges = applyTeamSpecificGravity(newBoard, capturingPlayer) || hasChanges;
      
      // 2. PAWN SPAWNING from opposite side
      hasChanges = spawnPawnsFromOppositeSide(newBoard, capturingPlayer) || hasChanges;
      
      // 3. SINGLE AUTO-CAPTURE by next player
      const nextPlayer = (capturingPlayer + 1) % 4;
      const autoCaptureHappened = performSingleAutoCapture(newBoard, nextPlayer);
      hasChanges = autoCaptureHappened || hasChanges;
      
      // Update board state
      setBoard([...newBoard]);
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Cascade completed in ${iterations} iterations`);
    setCascadeHighlights([]); // Clear highlights
    setIsCascading(false);
    nextTurn();
  };

  const applyTeamSpecificGravity = (board, capturingPlayer) => {
    let hasChanges = false;
    
    switch (capturingPlayer) {
      case 0: // Blue - pieces fall downward
        for (let col = 0; col < 8; col++) {
          for (let row = 7; row > 0; row--) {
            if (!board[row][col] && board[row - 1][col]) {
              board[row][col] = board[row - 1][col];
              board[row - 1][col] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 1: // Red - pieces fall rightward
        for (let row = 0; row < 8; row++) {
          for (let col = 7; col > 0; col--) {
            if (!board[row][col] && board[row][col - 1]) {
              board[row][col] = board[row][col - 1];
              board[row][col - 1] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 2: // Yellow - pieces fall upward
        for (let col = 0; col < 8; col++) {
          for (let row = 0; row < 7; row++) {
            if (!board[row][col] && board[row + 1][col]) {
              board[row][col] = board[row + 1][col];
              board[row + 1][col] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 3: // Green - pieces fall leftward
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 7; col++) {
            if (!board[row][col] && board[row][col + 1]) {
              board[row][col] = board[row][col + 1];
              board[row][col + 1] = null;
              hasChanges = true;
            }
          }
        }
        break;
    }
    
    return hasChanges;
  };

  const spawnPawnsFromOppositeSide = (board, capturingPlayer) => {
    let hasChanges = false;
    
    switch (capturingPlayer) {
      case 0: // Blue captures - pawns spawn from TOP
        for (let col = 0; col < 8; col++) {
          if (!board[0][col]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[0][col] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 1: // Red captures - pawns spawn from LEFT
        for (let row = 0; row < 8; row++) {
          if (!board[row][0]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[row][0] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 2: // Yellow captures - pawns spawn from BOTTOM
        for (let col = 0; col < 8; col++) {
          if (!board[7][col]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[7][col] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 3: // Green captures - pawns spawn from RIGHT
        for (let row = 0; row < 8; row++) {
          if (!board[row][7]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[row][7] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
    }
    
    return hasChanges;
  };

  const getCascadeHighlights = (board, capturingPlayer) => {
    const highlights = [];
    
    // Find empty spaces that will be filled by gravity
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!board[row][col]) {
          // Check if this empty space will be filled by gravity
          let willBeFilled = false;
          
          switch (capturingPlayer) {
            case 0: // Blue - check if piece above will fall down
              if (row > 0 && board[row - 1][col]) willBeFilled = true;
              break;
            case 1: // Red - check if piece to left will fall right
              if (col > 0 && board[row][col - 1]) willBeFilled = true;
              break;
            case 2: // Yellow - check if piece below will fall up
              if (row < 7 && board[row + 1][col]) willBeFilled = true;
              break;
            case 3: // Green - check if piece to right will fall left
              if (col < 7 && board[row][col + 1]) willBeFilled = true;
              break;
          }
          
          if (willBeFilled) {
            highlights.push({ row, col, type: 'gravity' });
          }
        }
      }
    }
    
    // Find pawn spawning positions
    switch (capturingPlayer) {
      case 0: // Blue captures - pawns spawn from TOP
        for (let col = 0; col < 8; col++) {
          if (!board[0][col]) {
            highlights.push({ row: 0, col, type: 'spawn' });
          }
        }
        break;
      case 1: // Red captures - pawns spawn from LEFT
        for (let row = 0; row < 8; row++) {
          if (!board[row][0]) {
            highlights.push({ row, col: 0, type: 'spawn' });
          }
        }
        break;
      case 2: // Yellow captures - pawns spawn from BOTTOM
        for (let col = 0; col < 8; col++) {
          if (!board[7][col]) {
            highlights.push({ row: 7, col, type: 'spawn' });
          }
        }
        break;
      case 3: // Green captures - pawns spawn from RIGHT
        for (let row = 0; row < 8; row++) {
          if (!board[row][7]) {
            highlights.push({ row, col: 7, type: 'spawn' });
          }
        }
        break;
    }
    
    return highlights;
  };

  const performSingleAutoCapture = (board, nextPlayer) => {
    // Find all pieces that can be captured by next player
    const captureOpportunities = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const targetPiece = board[row][col];
        if (targetPiece && targetPiece.teamIndex !== nextPlayer) {
          // Check if any of next player's pieces can capture this
          for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
              const attackingPiece = board[fromRow][fromCol];
              if (attackingPiece && attackingPiece.teamIndex === nextPlayer) {
                if (isValidMove(fromRow, fromCol, row, col, attackingPiece)) {
                  captureOpportunities.push({
                    fromRow, fromCol, toRow: row, toCol: col,
                    attackingPiece, targetPiece
                  });
                }
              }
            }
          }
        }
      }
    }
    
    if (captureOpportunities.length === 0) return false;
    
    // Find the capture with highest priority piece
    const priorityOrder = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    let bestCapture = captureOpportunities[0];
    
    for (const capture of captureOpportunities) {
      const currentPriority = priorityOrder.indexOf(capture.attackingPiece.type);
      const bestPriority = priorityOrder.indexOf(bestCapture.attackingPiece.type);
      if (currentPriority < bestPriority) {
        bestCapture = capture;
      }
    }
    
    // Perform the single auto-capture
    board[bestCapture.toRow][bestCapture.toCol] = bestCapture.attackingPiece;
    board[bestCapture.fromRow][bestCapture.fromCol] = null;
    
    // Update points for next player
    const points = getCapturePoints(bestCapture.targetPiece.type, nextPlayer);
    const newPoints = [...playerPoints];
    newPoints[nextPlayer] += points;
    setPlayerPoints(newPoints);
    
    // Update pawn capture count if it's a pawn
    if (bestCapture.targetPiece.type === 'pawn') {
      const newPawnCaptures = [...pawnCaptures];
      newPawnCaptures[nextPlayer]++;
      setPawnCaptures(newPawnCaptures);
    }
    
    // Move king based on points earned from auto-capture
    const victoryAchieved = moveKingBasedOnPoints(nextPlayer, points);
    
    console.log(`Auto-capture: ${bestCapture.attackingPiece.type} captured ${bestCapture.targetPiece.type}, ${TEAMS[nextPlayer]} king moved`);
    
    return true;
  };

  const handlePieceMove = (fromRow, fromCol, toRow, toCol) => {
    if (isCascading) return;
    
    const piece = board[fromRow][fromCol];
    if (!isValidMove(fromRow, fromCol, toRow, toCol, piece)) return;

    const newBoard = board.map(row => [...row]);
    const capturedPiece = newBoard[toRow][toCol];
    
    // Move piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
          // Handle capture
      if (capturedPiece) {
        // Play specific sound based on captured piece type
        if (capturedPiece.type === 'queen') {
          playSound('queen-capture');
          // Show queen kill modal
          setKilledQueenTeam(TEAMS[capturedPiece.teamIndex]);
          setShowQueenKillModal(true);
          setTimeout(() => setShowQueenKillModal(false), 3000); // Hide after 3 seconds
        } else if (capturedPiece.type === 'king') {
          playSound('king-capture');
        } else {
          playSound('capture');
        }
      
      const points = getCapturePoints(capturedPiece.type, currentPlayer);
      console.log(`Capture! ${TEAMS[currentPlayer]} captured ${capturedPiece.type} worth ${points} points`);
      console.log(`Piece values: Queen=6, Rook=5, Bishop=4, Knight=3, Pawn=2/1`);
      
      const newPoints = [...playerPoints];
      newPoints[currentPlayer] += points;
      setPlayerPoints(newPoints);
      
      // Update pawn capture count if it's a pawn
      if (capturedPiece.type === 'pawn') {
        const newPawnCaptures = [...pawnCaptures];
        newPawnCaptures[currentPlayer]++;
        setPawnCaptures(newPawnCaptures);
        console.log(`Pawn captures for ${TEAMS[currentPlayer]}: ${newPawnCaptures[currentPlayer]}`);
      }
      
      console.log(`Updated player points:`, newPoints);
      console.log(`Current king positions before move:`, kingPositions);
      
      // Move king immediately based on points earned
      const victoryAchieved = moveKingBasedOnPoints(currentPlayer, points);
      
      if (victoryAchieved) {
        setBoard(newBoard);
        return; // Game ends
      }
      
      // Update board first, then trigger cascading
      setBoard(newBoard);
      
      // Trigger cascading after a short delay
      setTimeout(() => {
        setIsCascading(true);
        performCascade(newBoard, currentPlayer);
      }, 300);
    } else {
      playSound('move');
      setBoard(newBoard);
      nextTurn();
    }
  };

  // NEW FUNCTION: Move king step by step like Ludo
  const moveKingStepByStep = (playerIndex, startPosition, endPosition, finalProgress) => {
    // Calculate the actual path the king should take
    const path = [];
    let currentPos = startPosition;
    let currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
    
    // Build the path step by step
    while (currentPos !== endPosition && currentProgress < finalProgress) {
      let nextPos;
      
      if (currentProgress < 32) {
        // Still in full round - move forward on 32-box path
        nextPos = (currentPos + 1) % 32;
      } else if (currentProgress === 32) {
        // Transition from 32-box path to home stretch (Box 1)
        nextPos = 1; // Box 1 (position 1)
      } else {
        // In home stretch - move towards home position
        const homeStretchMoves = currentProgress - 32;
        nextPos = homeStretchMoves + 1; // Box 1 (position 1), Box 2 (position 2), etc.
      }
      
      path.push(nextPos);
      currentPos = nextPos;
      currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
      
      // Safety check to prevent infinite loop
      if (path.length > 50) break;
    }
    
    // If no path was built, just move directly to end position
    if (path.length === 0) {
      path.push(endPosition);
    }
    
    let currentStep = 0;
    
    const moveOneStep = () => {
      if (currentStep < path.length) {
        // Move to next position in path
        const newKingPositions = [...kingPositions];
        newKingPositions[playerIndex] = path[currentStep];
        setKingPositions(newKingPositions);
        
        currentStep++;
        
        // Continue to next step after a short delay
        setTimeout(moveOneStep, 300); // 300ms delay between steps
      } else {
        // Final step - set to exact target position and progress
        const newKingPositions = [...kingPositions];
        const newKingProgress = [...kingProgress];
        
        newKingPositions[playerIndex] = endPosition;
        newKingProgress[playerIndex] = finalProgress;
        
        setKingPositions(newKingPositions);
        setKingProgress(newKingProgress);
        
        // Check for victory
        if (finalProgress >= 40) {
          setGamePhase('victory');
        }
      }
    };
    
    // Start the step-by-step movement
    moveOneStep();
  };

  // NEW: Simplified step-by-step movement that works correctly
  const moveKingStepByStepSimple = (playerIndex, startPosition, endPosition, finalProgress) => {
    // Calculate the actual path the king should take
    const path = [];
    let currentPos = startPosition;
    let currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
    
    // Build the path step by step
    while (currentPos !== endPosition && currentProgress < finalProgress) {
      let nextPos;
      
      if (currentProgress < 32) {
        // Still in full round - move forward on 32-box path
        nextPos = (currentPos + 1) % 32;
      } else if (currentProgress === 32) {
        // Transition from 32-box path to home stretch (Box 1)
        nextPos = 1; // Box 1 (position 1)
      } else {
        // In home stretch - move towards home position
        const homeStretchMoves = currentProgress - 32;
        nextPos = homeStretchMoves + 1; // Box 1 (position 1), Box 2 (position 2), etc.
      }
      
      path.push(nextPos);
      currentPos = nextPos;
      currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
      
      // Safety check to prevent infinite loop
      if (path.length > 50) break;
    }
    
    // If no path was built, just move directly to end position
    if (path.length === 0) {
      path.push(endPosition);
    }
    
    let currentStep = 0;
    
    const moveOneStep = () => {
      if (currentStep < path.length) {
        // Move to next position in path
        const newKingPositions = [...kingPositions];
        newKingPositions[playerIndex] = path[currentStep];
        setKingPositions(newKingPositions);
        
        currentStep++;
        
        // Continue to next step after a short delay
        setTimeout(moveOneStep, 300); // 300ms delay between steps
      } else {
        // Final step - set to exact target position and progress
        const newKingPositions = [...kingPositions];
        const newKingProgress = [...kingProgress];
        
        newKingPositions[playerIndex] = endPosition;
        newKingProgress[playerIndex] = finalProgress;
        
        setKingPositions(newKingPositions);
        setKingProgress(newKingProgress);
        
        // Check for victory
        if (finalProgress >= 40) {
          setGamePhase('victory');
        }
      }
    };
    
    // Start the step-by-step movement
    moveOneStep();
  };

  // NEW: Completely rewritten step-by-step movement
  const moveKingStepByStepCorrect = (playerIndex, startPosition, endPosition, finalProgress) => {
    // Calculate the actual path the king should take
    const path = [];
    let currentPos = startPosition;
    let currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
    
    // Build the path step by step
    while (currentPos !== endPosition && currentProgress < finalProgress) {
      let nextPos;
      
      if (currentProgress < 32) {
        // Still in full round - move forward on 32-box path
        nextPos = (currentPos + 1) % 32;
      } else if (currentProgress === 32) {
        // Transition from 32-box path to home stretch (Box 1)
        nextPos = 1; // Box 1 (position 1)
      } else {
        // In home stretch - move towards home position
        const homeStretchMoves = currentProgress - 32;
        nextPos = homeStretchMoves + 1; // Box 1 (position 1), Box 2 (position 2), etc.
      }
      
      path.push(nextPos);
      currentPos = nextPos;
      currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
      
      // Safety check to prevent infinite loop
      if (path.length > 50) break;
    }
    
    // If no path was built, just move directly to end position
    if (path.length === 0) {
      path.push(endPosition);
    }
    
    let currentStep = 0;
    
    const moveOneStep = () => {
      if (currentStep < path.length) {
        // Move to next position in path
        const newKingPositions = [...kingPositions];
        newKingPositions[playerIndex] = path[currentStep];
        setKingPositions(newKingPositions);
        
        currentStep++;
        
        // Continue to next step after a short delay
        setTimeout(moveOneStep, 300); // 300ms delay between steps
      } else {
        // Final step - set to exact target position and progress
        const newKingPositions = [...kingPositions];
        const newKingProgress = [...kingProgress];
        
        newKingPositions[playerIndex] = endPosition;
        newKingProgress[playerIndex] = finalProgress;
        
        setKingPositions(newKingPositions);
        setKingProgress(newKingProgress);
        
        // Check for victory
        if (finalProgress >= 40) {
          setGamePhase('victory');
        }
      }
    };
    
    // Start the step-by-step movement
    moveOneStep();
  };

  // NEW: Proper step-by-step movement with correct path calculation
  const moveKingStepByStepFixed = (playerIndex, startPosition, endPosition, finalProgress) => {
    console.log(`Starting step-by-step movement: ${TEAMS[playerIndex]} king from ${startPosition} to ${endPosition}, final progress: ${finalProgress}`);
    
    // Calculate total steps needed
    const totalSteps = finalProgress - kingProgress[playerIndex];
    
    console.log(`Total steps needed: ${totalSteps}`);
    
    let currentStep = 0;
    let currentPos = startPosition;
    let currentProgressValue = kingProgress[playerIndex];
    
    const moveOneStep = () => {
      if (currentStep < totalSteps) {
        // Calculate next position based on current progress
        let nextPos;
        let nextProgress = currentProgressValue + 1;
        
        if (nextProgress <= 32) {
          // Still in full round - move forward on 32-box path
          const startingPosition = getKingStartingPosition(playerIndex);
          nextPos = startingPosition + nextProgress - 1;
          if (nextPos >= 32) nextPos = nextPos - 32; // Wrap around
        } else if (nextProgress === 33) {
          // Transition from 32-box path to home stretch (Box 0)
          nextPos = 0; // Box 0 (position 0)
          // Play 32-box completion sound
          playSound('32-box-complete');
        } else {
          // In home stretch - move towards home position
          const homeStretchMoves = nextProgress - 32;
          nextPos = homeStretchMoves - 1; // Box 0 (position 0), Box 1 (position 1), etc.
        }
        
        // Update king position
        const newKingPositions = [...kingPositions];
        newKingPositions[playerIndex] = nextPos;
        setKingPositions(newKingPositions);
        
        // Update progress
        const newKingProgress = [...kingProgress];
        newKingProgress[playerIndex] = nextProgress;
        setKingProgress(newKingProgress);
        
        // Play king movement sound for each step
        playSound('move');
        
        console.log(`Step ${currentStep + 1}: ${TEAMS[playerIndex]} king moved to position ${nextPos}, progress: ${nextProgress}`);
        
        // Check for immediate victory when king reaches throne box (Box 7, position 7)
        if (nextPos === 7 && nextProgress >= 40) {
          console.log(`VICTORY! ${TEAMS[playerIndex]} king reached throne box!`);
          setWinningPlayer(playerIndex);
          setGamePhase('victory');
          playSound('victory');
          return; // Stop movement immediately
        }
        
        currentStep++;
        currentPos = nextPos;
        currentProgressValue = nextProgress;
        
        // Continue to next step after a short delay
        setTimeout(moveOneStep, 300); // 300ms delay between steps for smooth visual effect
      } else {
        console.log(`Step-by-step movement completed for ${TEAMS[playerIndex]} king`);
        
        // Reset points for this player after king movement is complete
        const newPoints = [...playerPoints];
        newPoints[playerIndex] = 0;
        setPlayerPoints(newPoints);
        
        // Check for victory (only if not already declared during movement)
        if (finalProgress >= 40 && gamePhase !== 'victory') {
          setWinningPlayer(playerIndex);
          setGamePhase('victory');
          playSound('victory');
        }
      }
    };
    
    // Start the step-by-step movement
    moveOneStep();
  };

  // Helper function to calculate progress from position (0-based indexing)
  const calculateProgressFromPosition = (playerIndex, position) => {
    const startingPosition = getKingStartingPosition(playerIndex);
    
    if (position >= 0 && position <= 7) {
      // In home stretch (Box 0-7) - progress 33-40
      return 32 + position + 1; // Box 0 = progress 33, Box 7 = progress 40
    } else {
      // In full round (32-box path) - progress 1-32
      if (position >= startingPosition) {
        return position - startingPosition + 1; // Starting position = progress 1
      } else {
        // Wrapped around
        return (32 - startingPosition) + position + 1;
      }
    }
  };

  // FIXED: Proper Ludo-style king movement logic
  const moveKingBasedOnPoints = (playerIndex, pointsEarned) => {
    console.log(`Moving king for ${TEAMS[playerIndex]}, points earned: ${pointsEarned}`);
    
    const newKingPositions = [...kingPositions];
    const newKingProgress = [...kingProgress];
    
    // LUDO-STYLE KING MOVEMENT: Points = Steps
    const stepsToMove = pointsEarned;
    
    console.log(`Steps to move: ${stepsToMove}`);
    
    if (stepsToMove > 0) {
      const currentPosition = kingPositions[playerIndex];
      const startingPosition = getKingStartingPosition(playerIndex);
      
      // Calculate new progress (total moves made)
      const newProgress = newKingProgress[playerIndex] + stepsToMove;
      
      let newPosition;
      
      if (newProgress <= 32) {
        // Still in full round phase (1-32 progress)
        // Calculate position on the 32-box path
        newPosition = startingPosition + newProgress - 1;
        if (newPosition >= 32) {
          newPosition = newPosition - 32; // Wrap around
        }
      } else if (newProgress <= 40) {
        // Home stretch phase (33-40 progress)
        // After 32 boxes, continue from Box 0 onwards
        const homeStretchMoves = newProgress - 32;
        newPosition = homeStretchMoves - 1; // Box 0 (position 0), Box 1 (position 1), etc.
        
        // Play 32-box completion sound when entering home stretch
        if (newKingProgress[playerIndex] <= 32 && newProgress > 32) {
          playSound('32-box-complete');
          // Show throne modal
          setThroneTeam(TEAMS[playerIndex]);
          setShowThroneModal(true);
          setTimeout(() => setShowThroneModal(false), 3000); // Hide after 3 seconds
        }
      } else {
        // Victory! (40+ progress)
        newPosition = 7; // Final home position (Box 7)
      }
      
      console.log(`King moving from position ${currentPosition} to ${newPosition}, progress: ${newProgress}`);
      
      // Check if new position conflicts with another king
      const conflictingKing = newKingPositions.findIndex((pos, index) => 
        index !== playerIndex && pos === newPosition
      );
      
      if (conflictingKing !== -1) {
        // King collision! ONLY the ARRIVING king gets killed and respawns at starting position
        console.log(`King collision! ${TEAMS[playerIndex]} king killed by ${TEAMS[conflictingKing]} king`);
        
        // Play king kill sound when king is killed
        playSound('king-capture');
        
        newKingPositions[playerIndex] = startingPosition;
        newKingProgress[playerIndex] = 1; // Reset progress when killed
        setKingPositions(newKingPositions);
        setKingProgress(newKingProgress);
        return false; // Don't continue with normal flow - king was killed
      } else {
        // Safe move - move step by step
        moveKingStepByStepFixed(playerIndex, currentPosition, newPosition, newProgress);
        return false; // Don't continue with normal flow
      }
    }
    
    console.log(`Updated king positions:`, newKingPositions);
    console.log(`Updated king progress:`, newKingProgress);
    
    // Check for victory (40 total moves: 32 full round + 8 home stretch)
    // Victory is only declared when king reaches throne box (position 7) with progress >= 40
    if (newKingProgress[playerIndex] >= 40 && newKingPositions[playerIndex] === 7) {
      setWinningPlayer(playerIndex); // Set the actual winner
      setGamePhase('victory');
      playSound('victory');
      return true; // Victory achieved
    }
    
    return false; // No victory
  };

  const nextTurn = () => {
    // Don't reset points here - they should accumulate for king movement
    // Points will be reset when the king actually moves
    
    setCurrentPlayer((prev) => (prev + 1) % 4);
    setSelectedPiece(null);
  };

  const handleSquareClick = (row, col) => {
    if (isCascading) return;
    
    const piece = board[row][col];
    
    if (selectedPiece) {
      // Attempt to move
      handlePieceMove(selectedPiece.row, selectedPiece.col, row, col);
    } else if (piece && piece.teamIndex === currentPlayer) {
      // Select piece
      setSelectedPiece({ row, col, piece });
    }
  };

  const getPieceSymbol = (piece) => {
    const symbols = {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    };
    return symbols[piece.type] || '?';
  };

  // Calculate points for captured piece (Ludo-style)
  const getCapturePoints = (pieceType, playerIndex) => {
    if (pieceType === 'pawn') {
      // First pawn capture = 2 points, subsequent = 1 point
      return pawnCaptures[playerIndex] === 0 ? 2 : 1;
    } else {
      // Other pieces: Queen=6, Rook=5, Bishop=4, Knight=3
      return PIECE_VALUES[pieceType] || 0;
    }
  };

  // PIECE ROTATION LOGIC - All pieces face current player's direction
  const getPieceRotation = (pieceTeamIndex, currentPlayerIndex) => {
    // All pieces rotate to face the current player's direction
    // Blue=0 (upward), Red=1 (rightward), Yellow=2 (downward), Green=3 (leftward)
    switch (currentPlayerIndex) {
      case 0: return 0;    // Blue's turn - pieces face upward (0°)
      case 1: return 270;  // Red's turn - pieces face rightward (270°)
      case 2: return 180;  // Yellow's turn - pieces face downward (180°)
      case 3: return 90;   // Green's turn - pieces face leftward (90°)
      default: return 0;
    }
  };

  // KING PATH LOGIC - FIXED SEQUENTIAL LAYOUT
  const getKingPathBox = (position) => {
    // 32-box outer path: B1-B32 in sequential order
    // Layout: Bottom (B1-B8) → Right (B9-B16) → Top (B17-B24) → Left (B25-B32)
    
    if (position < 8) {
      // Bottom row: B1-B8 (left to right)
      return { row: 7, col: position };
    } else if (position < 16) {
      // Right column: B9-B16 (bottom to top)
      return { row: 15 - position, col: 7 };
    } else if (position < 24) {
      // Top row: B17-B24 (right to left)
      return { row: 0, col: 23 - position };
    } else {
      // Left column: B25-B32 (top to bottom)
      return { row: position - 24, col: 0 };
    }
  };

  const getKingHomePosition = (teamIndex) => {
    // Home positions: Blue=B8, Red=B16, Yellow=B24, Green=B32
    switch (teamIndex) {
      case 0: return 7; // Blue: B8
      case 1: return 15; // Red: B16
      case 2: return 23; // Yellow: B24
      case 3: return 31; // Green: B32
      default: return 0;
    }
  };

  const getKingStartingPosition = (teamIndex) => {
    // Starting positions: Blue=B1, Red=B9, Yellow=B17, Green=B25 (using 1-32 system)
    // But we need to use 0-based indexing for the actual positions
    switch (teamIndex) {
      case 0: return 0; // Blue: B1 (position 0)
      case 1: return 8; // Red: B9 (position 8)
      case 2: return 16; // Yellow: B17 (position 16)
      case 3: return 24; // Green: B25 (position 24)
      default: return 0;
    }
  };

  // Helper function to get color class based on path position
  const getPathColorClass = (pathPosition) => {
    if (pathPosition >= 0 && pathPosition <= 7) {
      return 'path-blue'; // Box 1-8 (Blue section)
    } else if (pathPosition >= 8 && pathPosition <= 15) {
      return 'path-red'; // Box 9-16 (Red section)
    } else if (pathPosition >= 16 && pathPosition <= 23) {
      return 'path-yellow'; // Box 17-24 (Yellow section)
    } else if (pathPosition >= 24 && pathPosition <= 31) {
      return 'path-green'; // Box 25-32 (Green section)
    }
    return '';
  };

  // Game flow handlers
  const handleSplashComplete = () => {
    setAppPhase('mode-selection');
  };

  const handleModeSelect = (mode) => {
    // Reset ALL game state when selecting a new mode
    setSelectedGameMode(mode);
    setBoard([]);
    setKingPositions([0, 8, 16, 24]); // Reset to first boxes (0-based indexing)
    setCascadeHighlights([]);
    setCurrentPlayer(0);
    setSelectedPiece(null);
    setPlayerPoints([0, 0, 0, 0]);
    setKingProgress([1, 1, 1, 1]);
    setPawnCaptures([0, 0, 0, 0]);
    setGamePhase('setup');
    setIsCascading(false);
    setAppPhase('game-splash');
  };

  const handleGameSplashComplete = () => {
    setAppPhase('game');
    // Initialize fresh board when game starts
    initializeBoard();
  };

  const handleBackToMenu = () => {
    setAppPhase('mode-selection');
    setSelectedGameMode(null);
    // Reset game state when going back to menu
    setBoard([]);
    setKingPositions([0, 8, 16, 24]); // Using 0-based indexing for first boxes
    setCascadeHighlights([]);
    setCurrentPlayer(0);
    setSelectedPiece(null);
    setPlayerPoints([0, 0, 0, 0]);
    setKingProgress([1, 1, 1, 1]);
    setPawnCaptures([0, 0, 0, 0]);
    setGamePhase('setup');
    setIsCascading(false);
  };

  // AI Player Logic
  const isAIPlayer = (playerIndex) => {
    if (!selectedGameMode) return false;
    
    switch (selectedGameMode.id) {
      case '1player':
        return playerIndex !== 0; // Blue (player 0) is human, others are AI
      case '2player':
        return playerIndex === 1 || playerIndex === 3; // Red (1) and Green (3) are AI, Blue (0) and Yellow (2) are human
      case '3player':
        return playerIndex === 1; // Red (1) is AI, Blue (0), Yellow (2), and Green (3) are human
      case '4player':
        return false; // All players are human
      default:
        return false;
    }
  };

  const makeAIMove = () => {
    if (!isAIPlayer(currentPlayer)) return;

    // Simple AI: Find a random valid move
    const validMoves = [];
    
    // Find all pieces belonging to current AI player
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.teamIndex === currentPlayer) {
          // Find all valid moves for this piece
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(row, col, toRow, toCol, piece)) {
                validMoves.push({ fromRow: row, fromCol: col, toRow, toCol });
              }
            }
          }
        }
      }
    }

    if (validMoves.length > 0) {
      // Choose a random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      // Add a small delay to make AI moves visible
      setTimeout(() => {
        handlePieceMove(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
      }, 1000);
    } else {
      // No valid moves, skip turn
      nextTurn();
    }
  };

  // Function to handle player name changes
  const handlePlayerNameChange = (playerIndex, newName) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[playerIndex] = newName;
    setPlayerNames(newPlayerNames);
  };

  // Function to skip current player's turn
  const skipTurn = () => {
    setSelectedPiece(null);
    nextTurn();
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (appPhase === 'game' && isAIPlayer(currentPlayer) && !isCascading) {
      makeAIMove();
    }
  }, [currentPlayer, appPhase, isCascading]);

  // Render based on app phase
  if (appPhase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  
  if (appPhase === 'mode-selection') {
    return (
      <GameModeSelection 
        onModeSelect={handleModeSelect}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        isBackgroundMusicEnabled={isBackgroundMusicEnabled}
        setIsBackgroundMusicEnabled={setIsBackgroundMusicEnabled}
      />
    );
  }
  
  if (appPhase === 'game-splash') {
    return (
      <SplashScreen 
        onComplete={handleGameSplashComplete}
                  title={`${selectedGameMode?.title || 'Crush Ludo Chess'}`}
        subtitle="Game Starting..."
      />
    );
  }

  return (
    <div className="App">
      <div className="floating-objects">
        {Array(40).fill(null).map((_, index) => (
          <div key={index} className="floating-object"></div>
        ))}
      </div>
      <header className="App-header">
        <div className="header-content">
          <img src="/crushludochesslogo.png" alt="CrushLudoChess Logo" className="game-logo" />
          <h1>Crush Ludo Chess</h1>
          {selectedGameMode && (
            <div className="game-mode-indicator">
              {selectedGameMode.title}
            </div>
          )}
        </div>
        <button className="back-to-menu-btn" onClick={handleBackToMenu}>
          ← Back to Menu
        </button>

              </header>



      {/* Main Board Section */}
      <div className="board-container">
        <div className="main-board-section">
          {/* Player Info Containers - Now positioned relative to main-board-section */}
          <div className={`player-info-container player-info-blue ${currentPlayer === 0 ? 'current-turn' : ''}`}>
            <input 
              type="text" 
              value={playerNames[0]} 
              onChange={(e) => handlePlayerNameChange(0, e.target.value)}
              className="player-name-input"
              placeholder="Name"
            />
                         <div>Points: {playerPoints[0]} | Progress: {kingProgress[0]}/40</div>
          </div>
          <div className={`player-info-container player-info-red ${currentPlayer === 1 ? 'current-turn' : ''}`}>
            <input 
              type="text" 
              value={playerNames[1]} 
              onChange={(e) => handlePlayerNameChange(1, e.target.value)}
              className="player-name-input"
              placeholder="Name"
            />
                         <div>Points: {playerPoints[1]} | Progress: {kingProgress[1]}/40</div>
          </div>
          <div className={`player-info-container player-info-yellow ${currentPlayer === 2 ? 'current-turn' : ''}`}>
            <input 
              type="text" 
              value={playerNames[2]} 
              onChange={(e) => handlePlayerNameChange(2, e.target.value)}
              className="player-name-input"
              placeholder="Name"
            />
                         <div>Points: {playerPoints[2]} | Progress: {kingProgress[2]}/40</div>
          </div>
          <div className={`player-info-container player-info-green ${currentPlayer === 3 ? 'current-turn' : ''}`}>
            <input 
              type="text" 
              value={playerNames[3]} 
              onChange={(e) => handlePlayerNameChange(3, e.target.value)}
              className="player-name-input"
              placeholder="Name"
            />
                         <div>Points: {playerPoints[3]} | Progress: {kingProgress[3]}/40</div>
          </div>
          {/* Top Row: Top-Left Corner, Top Path, Top-Right Corner */}
          <div className="board-top-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {/* Top-Left Corner Box - Between Yellow and Green */}
            <div className="corner-box corner-top-left">
              {currentPlayer === 2 && (
                <button className="skip-turn-btn skip-turn-yellow" onClick={skipTurn} title="Skip Turn">
                  ⬇️
                </button>
              )}
            </div>
            {/* Top King Path (B17-B24) - Yellow Player */}
            <div className="king-path-top">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = 23 - index; // B17-B24 (right to left)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                return (
                  <div key={`top-${index}`} className={`king-path-square ${getPathColorClass(pathPosition)}`}>
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                    {pathPosition === 23 && <div className="throne-label">👑</div>}
                  </div>
                );
              })}
            </div>
            {/* Top-Right Corner Box - Between Red and Yellow */}
            <div className="corner-box corner-top-right">
              {currentPlayer === 1 && (
                <button className="skip-turn-btn skip-turn-red" onClick={skipTurn} title="Skip Turn">
                  ⬅️
                </button>
              )}
            </div>
          </div>
          
          {/* Middle Row: Left Path, Board, Right Path */}
          <div className="board-middle-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {/* Left King Path (B25-B32) */}
            <div className="king-path-left">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = 24 + index; // B25-B32 (sequential)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                return (
                  <div key={`left-${index}`} className={`king-path-square ${getPathColorClass(pathPosition)}`}>
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                    {pathPosition === 31 && <div className="throne-label">👑</div>}
                  </div>
                );
              })}
            </div>
            {/* Main 8x8 Chess Board */}
            <div className="chess-board">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((piece, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`board-square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'} ${
                        selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex ? 'selected' : ''
                      } ${
                        cascadeHighlights.some(h => h.row === rowIndex && h.col === colIndex) ? 'cascade-highlight' : ''
                      }`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <div 
                          className="piece"
                          style={{ 
                            color: TEAM_COLORS[piece.teamIndex],
                            transform: `rotate(${getPieceRotation(piece.teamIndex, currentPlayer)}deg)`
                          }}
                        >
                          {getPieceSymbol(piece)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Right King Path (B9-B16) */}
            <div className="king-path-right">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = 15 - index; // B9-B16 (bottom to top)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                return (
                  <div key={`right-${index}`} className={`king-path-square ${getPathColorClass(pathPosition)}`}>
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                    {pathPosition === 15 && <div className="throne-label">👑</div>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Bottom Row: Bottom-Left Corner, Bottom Path, Bottom-Right Corner */}
          <div className="board-bottom-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {/* Bottom-Left Corner Box - Between Green and Blue */}
            <div className="corner-box corner-bottom-left">
              {currentPlayer === 3 && (
                <button className="skip-turn-btn skip-turn-green" onClick={skipTurn} title="Skip Turn">
                  ➡️
                </button>
              )}
            </div>
            {/* Bottom King Path (B1-B8) - Blue Player */}
            <div className="king-path-bottom">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = index; // B1-B8 (left to right)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                return (
                  <div key={`bottom-${index}`} className={`king-path-square ${getPathColorClass(pathPosition)}`}>
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                    {pathPosition === 7 && <div className="throne-label">👑</div>}
                  </div>
                );
              })}
            </div>
            {/* Bottom-Right Corner Box - Between Blue and Red */}
            <div className="corner-box corner-bottom-right">
              {currentPlayer === 0 && (
                <button className="skip-turn-btn skip-turn-blue" onClick={skipTurn} title="Skip Turn">
                  ⬆️
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Queen Kill Modal */}
      {showQueenKillModal && killedQueenTeam && (
        <div className="queen-kill-modal">
          <div className="queen-kill-content">
            <h2>⚔️ QUEEN KILLED! ⚔️</h2>
            <p>{killedQueenTeam.toUpperCase()} Queen has been eliminated!</p>
            <div className="queen-icon">👑</div>
          </div>
        </div>
      )}

      {/* Throne Modal */}
      {showThroneModal && throneTeam && (
        <div className="throne-modal">
          <div className="throne-content">
            <h2>🏰 REACHING THRONE! 🏰</h2>
            <p>{throneTeam.toUpperCase()} King is approaching the throne!</p>
            <div className="throne-icon">👑</div>
          </div>
        </div>
      )}

      {gamePhase === 'victory' && winningPlayer !== null && (
        <div className="victory-modal">
          <div className="victory-content">
            <h2>🎉 VICTORY! 🎉</h2>
            <p>Player {TEAMS[winningPlayer].toUpperCase()} wins!</p>
            <button onClick={initializeBoard}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
